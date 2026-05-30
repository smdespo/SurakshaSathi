from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras import layers, models


CLASS_MAPPING = {
    "normal": 0,
    "Fire": 1,
    "Robbery": 2,
    "Fighting": 3,
}
CLASS_NAMES = ["Normal", "Fire", "Robbery", "Fighting"]
SUPPORTED_VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv")
DEFAULT_IMAGE_SIZE = (64, 64)
DEFAULT_FRAME_STRIDE = 10
DEFAULT_TARGET_FPS = 3
DEFAULT_TEST_SIZE = 0.2
DEFAULT_RANDOM_STATE = 42
DEFAULT_EPOCHS = 10
DEFAULT_BATCH_SIZE = 32
DEFAULT_MODEL_PATH = "surakshasathi_model.keras"


def parse_args() -> argparse.Namespace:
    """Read user-provided paths and training options from the command line."""
    parser = argparse.ArgumentParser(
        description="Train once, then predict custom user videos without retraining."
    )
    parser.add_argument(
        "--mode",
        choices=["train", "predict"],
        required=True,
        help="Use 'train' to create/save a model, or 'predict' to load an existing model.",
    )
    parser.add_argument(
        "--dataset-path",
        default=os.getenv("VIDEO_DATASET_PATH"),
        help="Folder containing class subfolders such as normal/, Fire/, Robbery/, Fighting/.",
    )
    parser.add_argument(
        "--test-folder",
        default=os.getenv("VIDEO_TEST_FOLDER"),
        help="Folder containing videos to predict.",
    )
    parser.add_argument(
        "--video-path",
        help="Single video file to predict.",
    )
    parser.add_argument(
        "--model-path",
        default=DEFAULT_MODEL_PATH,
        help=f"Path to save or load the trained model (default: {DEFAULT_MODEL_PATH}).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=DEFAULT_EPOCHS,
        help=f"Training epochs (default: {DEFAULT_EPOCHS}).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Training batch size (default: {DEFAULT_BATCH_SIZE}).",
    )
    parser.add_argument(
        "--frame-stride",
        type=int,
        default=DEFAULT_FRAME_STRIDE,
        help=f"Take every Nth frame during training (default: {DEFAULT_FRAME_STRIDE}).",
    )
    parser.add_argument(
        "--target-fps",
        type=int,
        default=DEFAULT_TARGET_FPS,
        help=f"Frames per second to sample during prediction (default: {DEFAULT_TARGET_FPS}).",
    )
    return parser.parse_args()


def list_video_files(folder_path: Path) -> list[Path]:
    """Return all supported video files from a folder."""
    return sorted(
        path
        for path in folder_path.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_VIDEO_EXTENSIONS
    )


def create_background_subtractor() -> cv2.BackgroundSubtractorMOG2:
    """Create the motion mask extractor used during training and testing."""
    return cv2.createBackgroundSubtractorMOG2(
        history=500,
        varThreshold=50,
        detectShadows=False,
    )


def normalize_frames(frames: list[np.ndarray]) -> np.ndarray:
    """Convert raw grayscale frames into model-ready tensors."""
    if not frames:
        return np.empty((0, *DEFAULT_IMAGE_SIZE, 1), dtype="float32")

    frame_batch = np.array(frames, dtype="float32") / 255.0
    return np.expand_dims(frame_batch, axis=-1)


def extract_motion_frames(
    video_path: Path,
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
) -> list[np.ndarray]:
    """Extract foreground motion masks from sampled video frames."""
    capture = cv2.VideoCapture(str(video_path))
    subtractor = create_background_subtractor()
    frames: list[np.ndarray] = []
    frame_index = 0

    try:
        while capture.isOpened():
            success, frame = capture.read()
            if not success:
                break

            if frame_index % frame_stride == 0:
                foreground_mask = subtractor.apply(frame)
                resized_mask = cv2.resize(foreground_mask, img_size)
                frames.append(resized_mask)

            frame_index += 1
    finally:
        capture.release()

    return frames


def load_multiclass_dataset(
    base_dataset_path: str | os.PathLike[str],
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Load a video dataset arranged in class folders and convert it to motion masks.

    Expected structure:
    dataset/
        normal/
        Fire/
        Robbery/
        Fighting/
    """
    dataset_root = Path(base_dataset_path)
    if not dataset_root.exists():
        raise FileNotFoundError(f"Dataset folder does not exist: {dataset_root}")

    frames: list[np.ndarray] = []
    labels: list[int] = []

    for class_name, class_index in CLASS_MAPPING.items():
        class_folder = dataset_root / class_name
        if not class_folder.exists():
            print(f"Warning: missing folder '{class_name}' at {class_folder}")
            continue

        video_files = list_video_files(class_folder)
        print(
            f"Processing '{class_name}' (label {class_index}): "
            f"found {len(video_files)} videos."
        )

        for video_path in video_files:
            video_frames = extract_motion_frames(
                video_path,
                img_size=img_size,
                frame_stride=frame_stride,
            )
            frames.extend(video_frames)
            labels.extend([class_index] * len(video_frames))

    x_data = normalize_frames(frames)
    y_labels = np.array(labels, dtype="int32")

    print(f"Loaded dataset: X shape = {x_data.shape}, y shape = {y_labels.shape}")
    return x_data, y_labels


def prepare_train_test_data(
    base_dataset_path: str | os.PathLike[str],
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
    test_size: float = DEFAULT_TEST_SIZE,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Load the dataset and create a train/test split."""
    x_data, y_labels = load_multiclass_dataset(
        base_dataset_path,
        img_size=img_size,
        frame_stride=frame_stride,
    )

    if len(x_data) == 0:
        raise ValueError("No frames were extracted from the dataset.")

    if len(np.unique(y_labels)) < 2:
        raise ValueError("At least two classes with data are required for training.")

    x_train, x_test, y_train, y_test = train_test_split(
        x_data,
        y_labels,
        test_size=test_size,
        random_state=random_state,
        stratify=y_labels,
    )

    print(f"X_train shape: {x_train.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"X_test shape:  {x_test.shape}")
    print(f"y_test shape:  {y_test.shape}")

    return x_train, x_test, y_train, y_test


def build_multiclass_model(
    input_shape: tuple[int, int, int] = (64, 64, 1),
    num_classes: int = len(CLASS_MAPPING),
) -> models.Sequential:
    """Create and compile the multiclass CNN."""
    model = models.Sequential(
        [
            layers.Input(shape=input_shape),
            layers.Conv2D(32, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Flatten(),
            layers.Dense(64, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train_model(
    model: models.Sequential,
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = DEFAULT_BATCH_SIZE,
):
    """Train the model and return the Keras history."""
    return model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        verbose=1,
    )


def save_trained_model(
    trained_model: models.Sequential,
    model_path: str | os.PathLike[str],
) -> Path:
    """Save a trained model so future predictions do not retrain it."""
    target_path = Path(model_path)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    trained_model.save(target_path)
    print(f"Model saved to: {target_path}")
    return target_path


def load_trained_model(model_path: str | os.PathLike[str]) -> models.Sequential:
    """Load a previously trained model from disk."""
    target_path = Path(model_path)
    if not target_path.exists():
        raise FileNotFoundError(
            f"Saved model not found at {target_path}. Train the model first."
        )
    return models.load_model(target_path)


def extract_frames_for_inference(
    video_path: Path,
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    target_fps: int = DEFAULT_TARGET_FPS,
) -> list[np.ndarray]:
    """Sample video frames at a lower rate for faster prediction."""
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        return []

    native_fps = capture.get(cv2.CAP_PROP_FPS)
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if native_fps <= 0 or np.isnan(native_fps):
        native_fps = 30.0

    frame_stride = max(1, int(round(native_fps / target_fps)))
    subtractor = create_background_subtractor()
    frames: list[np.ndarray] = []

    try:
        for frame_index in range(0, total_frames, frame_stride):
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = capture.read()
            if not success:
                break

            foreground_mask = subtractor.apply(frame)
            resized_mask = cv2.resize(foreground_mask, img_size)
            frames.append(resized_mask)
    finally:
        capture.release()

    return frames


def predict_video(
    video_path: Path,
    trained_model: models.Sequential,
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    target_fps: int = DEFAULT_TARGET_FPS,
) -> dict[str, Any] | None:
    """Predict the most likely class for a single video."""
    frames = extract_frames_for_inference(
        video_path,
        img_size=img_size,
        target_fps=target_fps,
    )
    if not frames:
        return None

    input_batch = normalize_frames(frames)
    predictions = trained_model.predict(input_batch, verbose=0)
    average_probabilities = np.mean(predictions, axis=0)
    predicted_class_index = int(np.argmax(average_probabilities))

    return {
        "video_name": video_path.name,
        "frames_used": len(frames),
        "predicted_class_index": predicted_class_index,
        "predicted_class": CLASS_NAMES[predicted_class_index],
        "probabilities": {
            class_name: float(average_probabilities[index])
            for index, class_name in enumerate(CLASS_NAMES)
        },
    }


def print_prediction_result(result: dict[str, Any]) -> None:
    """Display a prediction in a readable format."""
    print(f"Video: {result['video_name']}")
    print(f"Frames used: {result['frames_used']}")
    print("Probabilities:")
    for class_name, probability in result["probabilities"].items():
        print(f" - {class_name}: {probability * 100:.2f}%")
    print(f"Final system verdict: {result['predicted_class'].upper()}\n")


def test_videos(
    base_folder_path: str | os.PathLike[str],
    trained_model: models.Sequential,
    img_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
    target_fps: int = DEFAULT_TARGET_FPS,
) -> list[dict[str, Any]]:
    """Run multiclass predictions for every video inside a folder."""
    folder_path = Path(base_folder_path)
    if not folder_path.exists():
        raise FileNotFoundError(f"Testing folder not found: {folder_path}")

    video_files = list_video_files(folder_path)
    if not video_files:
        raise ValueError(f"No supported video files found in: {folder_path}")

    results: list[dict[str, Any]] = []

    for video_path in video_files:
        result = predict_video(
            video_path,
            trained_model,
            img_size=img_size,
            target_fps=target_fps,
        )
        if result is None:
            print(f"Video: {video_path.name} -> No frames could be read.")
            continue

        results.append(result)
        print_prediction_result(result)

    return results


def main() -> None:
    """Train once and predict custom user inputs without retraining."""
    args = parse_args()
    project_root = Path(__file__).resolve().parent
    model_path = Path(args.model_path)

    if args.mode == "train":
        dataset_path = Path(args.dataset_path) if args.dataset_path else project_root
        x_train, x_test, y_train, y_test = prepare_train_test_data(
            dataset_path,
            frame_stride=args.frame_stride,
        )
        model = build_multiclass_model(input_shape=x_train.shape[1:])
        train_model(
            model,
            x_train,
            y_train,
            x_test,
            y_test,
            epochs=args.epochs,
            batch_size=args.batch_size,
        )
        save_trained_model(model, model_path)
        return

    model = load_trained_model(model_path)

    if args.video_path:
        result = predict_video(
            Path(args.video_path),
            model,
            target_fps=args.target_fps,
        )
        if result is None:
            raise ValueError(f"No frames could be read from video: {args.video_path}")
        print_prediction_result(result)
        return

    test_folder = Path(args.test_folder) if args.test_folder else project_root / "testing_folder"
    test_videos(
        test_folder,
        model,
        target_fps=args.target_fps,
    )


if __name__ == "__main__":
    main()

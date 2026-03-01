import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

MODEL_PATH = Path(__file__).resolve().parent.parent / "ppi_model.pkl"


def main():
    # Replace with curated ESG dataset before production use
    X = np.array(
        [
            [1.0, 0.9, 0.95, 0.2],
            [0.8, 0.8, 0.9, 0.3],
            [0.6, 0.6, 0.7, 0.5],
            [0.4, 0.5, 0.6, 0.6],
            [0.2, 0.3, 0.5, 0.8],
        ]
    )
    y = np.array([0.95, 0.85, 0.68, 0.55, 0.32])

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    model = GradientBoostingRegressor(random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_val)
    print("RMSE", mean_squared_error(y_val, preds, squared=False))
    joblib.dump(model, MODEL_PATH)
    print(f"saved {MODEL_PATH}")


if __name__ == "__main__":
    main()

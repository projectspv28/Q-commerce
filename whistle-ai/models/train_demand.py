import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

MODEL_PATH = Path(__file__).resolve().parent.parent / "demand_model.pkl"


def main():
    # Replace with real historical aggregates before production use
    X = np.array([[2, 15], [5, 40], [8, 60], [15, 120], [25, 200]])  # [avg_daily_orders, stock]
    y = np.array([1.8, 5.1, 7.9, 13.5, 21.0])  # velocity labels

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_val)
    print("RMSE", mean_squared_error(y_val, preds, squared=False))
    joblib.dump(model, MODEL_PATH)
    print(f"saved {MODEL_PATH}")


if __name__ == "__main__":
    main()

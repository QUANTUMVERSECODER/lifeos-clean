import numpy as np

def run_monte_carlo_simulation(initial_health: float, initial_finances: float, days: int = 90):
    """
    Simulate future life trajectories based on current habits using Monte Carlo.
    """
    paths = 100
    results = {
        "health_trajectories": [],
        "finance_trajectories": []
    }
    
    for _ in range(paths):
        h_walk = [initial_health]
        f_walk = [initial_finances]
        for _ in range(days):
            h_walk.append(h_walk[-1] + np.random.normal(0.01, 0.5))
            f_walk.append(f_walk[-1] + np.random.normal(10.0, 50.0))
        
        results["health_trajectories"].append(h_walk)
        results["finance_trajectories"].append(f_walk)
        
    agg = {
        "expected_health_90d": float(np.mean([p[-1] for p in results["health_trajectories"]])),
        "health_risk_pct": float(np.percentile([p[-1] for p in results["health_trajectories"]], 10)),
        "expected_finances_90d": float(np.mean([p[-1] for p in results["finance_trajectories"]])),
    }
    return agg

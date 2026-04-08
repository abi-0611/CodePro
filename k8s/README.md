# CodePro Kubernetes Scaffold

This directory contains a minimal Kubernetes setup for CodePro so you can run
the app in kind or any cluster and then point OptiPilot at it.

## What it deploys

- PostgreSQL for the backend database
- Redis for rate limiting and caching
- FastAPI backend at `api`
- Astro main site at `main-site`
- Astro admin frontend at `admin-frontend`
- A ServiceMonitor for the backend metrics endpoint

The Kubernetes deployment now uses your Neon database instead of the local
`postgres` StatefulSet.

## Local build flow

Build the images from the repository root:

```bash
docker build -t codepro-api:local ./admin-backend
docker build -t codepro-main-site:local -f Dockerfile.main .
docker build -t codepro-admin-frontend:local ./admin-frontend
```

If you are using kind, load the images into the cluster:

```bash
kind load docker-image codepro-api:local
kind load docker-image codepro-main-site:local
kind load docker-image codepro-admin-frontend:local
```

Apply the manifests:

```bash
kubectl apply -k k8s/
```

## Access the app

Port-forward each service from a separate terminal:

```bash
kubectl port-forward -n codepro svc/main-site 3000:3000
kubectl port-forward -n codepro svc/admin-frontend 4322:4322
kubectl port-forward -n codepro svc/api 8000:8000
```

Open these URLs:

- `http://localhost:3000`
- `http://localhost:4322/admin/login`
- `http://localhost:8000/docs`

## Use with OptiPilot

After the app is running, create a `ServiceObjective` and an
`OptimizationPolicy` that point to the backend deployment named `api` and the
`app: codepro-api` label.

You can apply the ready-made manifest in this folder:

```bash
kubectl apply -f k8s/optipilot-codepro.yaml
```

Example:

```bash
kubectl apply -f - <<'EOF'
apiVersion: slo.optipilot.ai/v1alpha1
kind: ServiceObjective
metadata:
  name: codepro-api-slo
  namespace: codepro
  labels:
    app: codepro-api
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  objectives:
    - metric: availability
      target: "99.9%"
      window: "5m"
    - metric: latency_p99
      target: "500ms"
      window: "5m"
  evaluationInterval: "30s"
  errorBudget:
    total: "0.1%"
EOF
```

```bash
kubectl apply -f - <<'EOF'
apiVersion: policy.optipilot.ai/v1alpha1
kind: OptimizationPolicy
metadata:
  name: codepro-api-policy
  namespace: codepro
spec:
  selector:
    matchLabels:
      app: codepro-api
  objectives:
    - name: slo_compliance
      direction: maximize
      weight: 0.7
    - name: cost
      direction: minimize
      weight: 0.3
  dryRun: true
EOF
```

If you want live changes, set `dryRun: false` after you confirm the first
decisions look correct.
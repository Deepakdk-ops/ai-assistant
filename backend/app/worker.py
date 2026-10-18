from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_assistant",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)
celery_app.conf.update(
    task_serializer="json", result_serializer="json", accept_content=["json"],
    task_track_started=True, task_acks_late=True, worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True, result_expires=86400,
    broker_connection_retry_on_startup=True,
    task_routes={"app.tasks.process_document": {"queue": "ingestion"},
                 "app.tasks.run_evaluation": {"queue": "evaluations"},
                 "app.tasks.run_agent": {"queue": "agents"}},
)

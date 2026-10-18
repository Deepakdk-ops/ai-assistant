"""Administrative commands intended to be run from the self-hosted container shell."""
import argparse
from sqlalchemy import select, update
from app.db.session import SessionLocal
from app.models.entities import User, Document, KnowledgeBase, Conversation, AgentRun, EvaluationRun


def main():
    parser = argparse.ArgumentParser(description="AI Assistant Workspace administration")
    sub = parser.add_subparsers(dest="command", required=True)
    promote = sub.add_parser("promote-admin", help="Promote an existing account to administrator")
    promote.add_argument("email")
    claim = sub.add_parser("claim-legacy-data", help="Assign unowned legacy records to an account")
    claim.add_argument("email")
    args = parser.parse_args()
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == args.email.lower().strip()))
        if not user:
            parser.error("Account not found; create the account first.")
        if args.command == "promote-admin":
            user.role = "admin"
            db.commit()
            print(f"Promoted {user.email} to admin.")
            return
        counts = {}
        for model in (Document, KnowledgeBase, Conversation, AgentRun, EvaluationRun):
            result = db.execute(update(model).where(model.user_id.is_(None)).values(user_id=user.id))
            counts[model.__tablename__] = result.rowcount
        db.commit()
        print(f"Assigned unowned legacy records to {user.email}: {counts}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

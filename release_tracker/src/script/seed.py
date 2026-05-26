from sqlmodel import Session, select

from src.database import get_engine
from src.models import Project

SAMPLE_PROJECTS: list[Project] = [
    Project(name="Frontend Redesign", slug="frontend-redesign"),
    Project(name="Payment API", slug="payment-api"),
    Project(name="Analytics Service", slug="analytics-service"),
]


def seed() -> None:
    with Session(get_engine()) as session:
        inserted = 0
        for project in SAMPLE_PROJECTS:
            existing = session.exec(
                select(Project).where(Project.slug == project.slug)
            ).first()
            if existing is not None:
                continue
            session.add(project)
            inserted += 1

        session.commit()

    print(
        f"Seed complete: inserted {inserted}, "
        f"skipped {len(SAMPLE_PROJECTS) - inserted} already present."
    )


if __name__ == "__main__":
    seed()

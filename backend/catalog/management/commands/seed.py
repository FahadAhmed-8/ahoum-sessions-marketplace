"""
Seed demo creators and sessions so a fresh clone shows a populated catalog.
Idempotent: skips if sessions already exist (unless --force).
"""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from catalog.models import Session

CREATORS = [
    {"uid": "seed-aarav", "name": "Aarav Sharma", "email": "aarav@example.com",
     "avatar_url": "https://i.pravatar.cc/150?img=11"},
    {"uid": "seed-priya", "name": "Priya Nair", "email": "priya@example.com",
     "avatar_url": "https://i.pravatar.cc/150?img=45"},
    {"uid": "seed-rohan", "name": "Rohan Gupta", "email": "rohan@example.com",
     "avatar_url": "https://i.pravatar.cc/150?img=15"},
]

# (creator_index, title, description, price, days, hour, duration, capacity)
SESSIONS = [
    (0, "Intro to Web Development",
     "A beginner-friendly walkthrough of HTML, CSS, and JavaScript fundamentals. "
     "Build your first responsive page by the end.", "0.00", 2, 18, 90, 40),
    (1, "Machine Learning Specialization",
     "A structured introduction to machine learning: supervised learning, model "
     "evaluation, and training your first model with Python.", "75.00", 5, 17, 120, 25),
    (0, "React from Scratch",
     "Learn modern React: components, hooks, state, and routing. Build a small app "
     "together and leave with practical skills.", "45.00", 4, 19, 90, 30),
    (2, "System Design Fundamentals",
     "How large-scale systems are built: load balancing, caching, databases, and "
     "trade-offs. Ideal for interview prep.", "60.00", 7, 16, 90, 20),
    (1, "Python for Data Analysis",
     "Get comfortable with pandas, NumPy, and data visualization. A practical "
     "session for anyone starting out in data.", "30.00", 3, 15, 60, 35),
]


class Command(BaseCommand):
    help = "Seed demo creators and sessions."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true")

    def handle(self, *args, **options):
        if options["force"]:
            Session.objects.filter(creator__provider_uid__startswith="seed-").delete()

        if Session.objects.exists() and not options["force"]:
            self.stdout.write(self.style.WARNING(
                "Sessions already exist; skipping seed. Use --force to reseed."))
            return

        creators = []
        for c in CREATORS:
            user, _ = User.objects.get_or_create(
                oauth_provider="google", provider_uid=c["uid"],
                defaults={
                    "username": User.generate_username("google", c["uid"]),
                    "name": c["name"], "email": c["email"],
                    "avatar_url": c["avatar_url"], "role": User.Role.CREATOR,
                })
            creators.append(user)

        now = timezone.now()
        created = 0
        for ci, title, desc, price, days, hour, dur, cap in SESSIONS:
            start = (now + timedelta(days=days)).replace(
                hour=hour, minute=0, second=0, microsecond=0)
            Session.objects.create(
                creator=creators[ci], title=title, description=desc,
                price=Decimal(price), start_time=start,
                duration_minutes=dur, capacity=cap, is_active=True)
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(creators)} creators and {created} sessions."))

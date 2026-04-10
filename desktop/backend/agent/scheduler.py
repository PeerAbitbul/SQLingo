from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from pathlib import Path
import os
import sqlite3

# Import our custom executor
from agent.executor import execute_agent_job

class AgentScheduler:
    def __init__(self):
        self.scheduler = None
        self.config_dir = Path.home() / '.sqlingo'
        self.config_dir.mkdir(exist_ok=True)
        self.jobstore_path = self.config_dir / 'jobs.sqlite'
        
    def start(self):
        try:
            print("[INFO] Starting Agent Scheduler...")
            jobstores = {
                'default': SQLAlchemyJobStore(url=f'sqlite:///{self.jobstore_path}')
            }
            job_defaults = {
                'coalesce': False,
                'max_instances': 5,
                'misfire_grace_time': 3600
            }
            self.scheduler = BackgroundScheduler(jobstores=jobstores, job_defaults=job_defaults)
            
            # Add listener for logging
            self.scheduler.add_listener(self._job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
            
            self.scheduler.start()
            print("[OK] Agent Scheduler started in background.")
            
            # Register default observer job (runs every 30 min)
            self._register_default_observer()
        except Exception as e:
            print(f"[ERROR] Failed to start Agent Scheduler: {e}")

    def _register_default_observer(self):
        """Register the proactive observer agent as a default system job."""
        try:
            from agent.executor import execute_observer_job
            existing = self.scheduler.get_job('system-observer')
            if not existing:
                self.scheduler.add_job(
                    execute_observer_job,
                    'cron',
                    minute='*/30',
                    id='system-observer',
                    replace_existing=True,
                    misfire_grace_time=3600
                )
                print("[OK] Default Observer job registered (every 30 min).")
            else:
                print("[OK] Default Observer job already exists.")
        except Exception as e:
            print(f"[WARNING] Could not register default observer: {e}")

    def _job_listener(self, event):
        if event.exception:
            print(f"[WARNING] Agent Job crashed: {event.job_id} - {event.exception}")
        else:
            print(f"[INFO] Agent Job executed successfully: {event.job_id}")

    def add_agent_job(self, agent_id: str, schedule: str, schedule_type: str = 'cron'):
        if not self.scheduler:
            return
            
        try:
            if schedule_type == 'date':
                from datetime import datetime
                run_date = datetime.strptime(schedule, "%Y-%m-%d %H:%M:%S")
                self.scheduler.add_job(
                    execute_agent_job,
                    'date',
                    run_date=run_date,
                    id=agent_id,
                    args=[agent_id],
                    replace_existing=True
                )
                print(f"[INFO] Added one-time job for agent {agent_id} at {schedule}")
                
            else:
                # Valid cron parsing for MVP string "minute hour day month day_of_week"
                parts = [p for p in schedule.strip().split(' ') if p]
                if len(parts) == 5:
                    minute, hour, day, month, day_of_week = parts
                    
                    self.scheduler.add_job(
                        execute_agent_job,
                        'cron',
                        minute=minute,
                        hour=hour,
                        day=day,
                        month=month,
                        day_of_week=day_of_week,
                        id=agent_id,
                        args=[agent_id],
                        replace_existing=True
                    )
                    print(f"[INFO] Added job for agent {agent_id} with schedule {schedule}")
                elif len(parts) == 6:
                    second, minute, hour, day, month, day_of_week = parts
                    
                    self.scheduler.add_job(
                        execute_agent_job,
                        'cron',
                        second=second,
                        minute=minute,
                        hour=hour,
                        day=day,
                        month=month,
                        day_of_week=day_of_week,
                        id=agent_id,
                        args=[agent_id],
                        replace_existing=True
                    )
                    print(f"[INFO] Added job for agent {agent_id} with schedule {schedule} (includes seconds)")
                else:
                    print(f"[ERROR] Invalid cron expression (expected 5 or 6 parts): {schedule}")
        except Exception as e:
            print(f"[ERROR] Failed to add agent job {agent_id}: {e}")

    def remove_agent_job(self, agent_id: str):
        if not self.scheduler:
            return
        try:
            if self.scheduler.get_job(agent_id):
                self.scheduler.remove_job(agent_id)
                print(f"[INFO] Removed job for agent {agent_id}")
        except Exception as e:
            print(f"[ERROR] Failed to remove agent job {agent_id}: {e}")

    def pause_all(self):
        if self.scheduler and self.scheduler.running:
            self.scheduler.pause()
            print("[INFO] Agent Scheduler PAUSED globally")

    def resume_all(self):
        if self.scheduler and self.scheduler.running:
            self.scheduler.resume()
            print("[INFO] Agent Scheduler RESUMED globally")

    def is_paused(self) -> bool:
        from apscheduler.schedulers.base import STATE_PAUSED
        if self.scheduler:
            return self.scheduler.state == STATE_PAUSED
        return False

# Global instance
agent_scheduler = AgentScheduler()

import sys, os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('d:/TalentResourcing tool/TalentStream/TalentStream/backend/.env')
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    row = conn.execute(text("SELECT matching_status, batches_completed, batches_total FROM job_requests WHERE id='c1abc009-5858-400b-b467-7d93d66cec21'")).fetchone()
    print(dict(row._mapping))

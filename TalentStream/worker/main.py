import os
import json
import time
import pika
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://tsuser:tspassword@rabbitmq:5672/")
QUEUE_NAME = "candidate_evaluation"

def process_message(ch, method, properties, body):
    payload = json.loads(body)
    job_id = payload.get("job_id")
    candidate_ids = payload.get("candidate_ids", [])
    batch_index = payload.get("batch_index", 0)
    
    print(f"[*] [Worker] Received Job {job_id} | Batch {batch_index} | Candidates: {candidate_ids}")
    
    try:
        # TODO 1: Fetch candidate profiles from DB (using candidate_ids)
        # TODO 2: Fetch JD from DB (using job_id)
        # TODO 3: Construct LLM prompt and execute ONE OpenAI call for the batch
        # TODO 4: Save LLM scores + explanations to DB
        
        # Simulating processing time
        time.sleep(2) 
        
        print(f"[x] [Worker] Successfully processed batch {batch_index} for Job {job_id}")
        
        # Only ACK after successful DB write
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"[!] [Worker] Error processing message: {e}")
        # NACK the message so it's requeued by RabbitMQ
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    print("[*] Worker is starting...")
    parameters = pika.URLParameters(RABBITMQ_URL)
    
    # Retry loop to ensure RabbitMQ is fully up
    for attempt in range(12):
        try:
            connection = pika.BlockingConnection(parameters)
            break
        except Exception as e:
            print(f"[!] Connection to RabbitMQ failed, retrying in 5 seconds... ({e})", flush=True)
            time.sleep(5)
    else:
        print("[!] Could not connect to RabbitMQ. Exiting.", flush=True)
        return

    channel = connection.channel()
    
    # Ensure queue exists and is durable
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    
    # Prefetch 1 message to ensure fair distribution amongst workers
    channel.basic_qos(prefetch_count=1)
    
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message)
    
    print(f"[*] Worker connected. Waiting for messages in '{QUEUE_NAME}'. To exit press CTRL+C")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\n[*] Stopping worker...")
        channel.stop_consuming()
    finally:
        connection.close()

if __name__ == '__main__':
    main()

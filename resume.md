# Resume

Paul Meyer
Senior Software Engineer – AI/ML Systems

SUMMARY 
 
Experienced Senior AI/ML Engineer with over 10 years of expertise in machine learning, software engineering, data engineering, and AI-driven solutions within healthcare and enterprise environments. Proven track record in designing and deploying scalable AI workflows, including NLP systems, distributed applications, and data pipelines, leveraging Python, PyTorch, TensorFlow, and cloud platforms (AWS, Azure, GCP). Skilled in optimizing data processing, system performance, and operational efficiency, with a commitment to maintaining industry standards and ensuring compliance.

EXPERIENCE
 
Principal AI/ML Engineer
Viz.AI | San Francisco, CA
06/2024 – Present
•	Led architecture and development of autonomous LLM agent systems using LangChain and LangGraph, AWS AgentCore with RAG architectures, enabling multi-step reasoning, tool use, and decision-making workflows for information retrieval, knowledge-grounded generation, and structured task automation across complex enterprise datasets.
•	Integrate AI agents with enterprise systems via APIs and RPA-style interfaces (UI/DOM/vision-based interactions) to execute real-world operational tasks.
•	Designed and implemented NLP pipelines on EHR data in FHIR format, including text classification, named entity recognition, question answering, and LLM-based RAG systems, leveraging transformer-based architectures for clinical information extraction and retrieval.
•	Developed deep learning models for ECG signal analysis, including classification and waveform delineation tasks to detect cardiac abnormalities, using time-series architectures such as CNNs and sequence models for physiological signal interpretation.
•	Built medical image segmentation pipelines for head CT scans, focusing on bleed detection, measurement extraction, supporting clinical trial recruitment workflows for embolization studies using U-Net based and hybrid segmentation architectures.
•	Supported FDA de-novo submission and clearance for an ECG-based deep learning system for Hypertrophic Cardiomyopathy detection, contributing to model validation, clinical study analysis, performance benchmarking, and interpretability reporting to meet regulatory-grade requirements.
•	Implemented production-grade guardrails, validation layers, human-in-the-loop review mechanisms, logging, and tracing frameworks to ensure safe, auditable, and reliable behavior of LLM-driven systems in regulated clinical environments.
•	Engineered end-to-end MLOps infrastructure from scratch (AWS ECS, Airflow, MLflow, Redshift), which supports real time model fine tuning, versioning, deployment and monitoring of 50+ unique production models including centralized experiment tracking, reproducibility, and deployment automation. 
•	Pioneered production-scale fallback system for Hybrid OCR Pipeline combining PaddleOCR with Claude Vision, achieving 97% accuracy via automated quality assessment and intelligent model selection for property record extraction.
 
Senior Machine Learning Engineer 
Box | Redwood City, CA
11/2021 – 05/2024
•	Engineered high-performance document processing pipeline for RAG applications, handling PDFs, images, HTML, and Word documents using PyTorch, computer vision models (YOLOX, YOLO-NAS, DetectronZ), and GPU – accelerated OCR, scaling to 100K+ documents daily with enterprise-grade reliability.
•	Developed scalable Retrieval-Augmented Generation (RAG) systems for Box.AI to connect enterprise unstructured data with LLMs. Improved retrieval quality and inference efficiency through embedding model evaluation, vector database recall benchmarking, prompt engineering, and adaptive text chunking strategies.
•	Evaluation of RAG systems is highly dependent on the context of the query and corpus. I implemented an evaluation set and testing framework for Box.AI that is more representative and diverse than the standard benchmark datasets. The queries and documents included are closer proxies in size and complexity to real customer use cases. This allowed the Box.AI team to more effectively prompt tune, examine throughput, debug corner cases, and performing regression tests when pushing changes.
•	Trained and deployed a large-scale TensorFlow Ranking (TF-Ranking) model powering enterprise search relevance for 1+ years, delivering a +4% NDCG improvement across high-volume user search traffic.
•	Optimized Apache Solr ranking and boost strategies to prioritize freshness-aware retrieval, increasing recall of recently updated content and improving Quick Search NDCG by over 5%.
•	Implemented CI/CD MLOps workflows using Kubernetes and Docker, enabling automated model deployment and A/B testing across 15+ production environments.
•	Streamlined infrastructure provisioning using Terraform, CloudFormation, and Ansible, implementing Python based automation and DevOps practices with infrastructure-as-code to reduce human errors by 60% across AWS and on-premise environments, deploying to Kubernetes.
•	Mentored an internship initiative to redesign the search Query Spell Checker pipeline, achieving 99.7% recall improvement and boosting F1 score by 93% through advanced query correction and retrieval optimization techniques.
•	Revamped the team’s data engineering infrastructure by migrating legacy ETL pipelines to Python 3 / PySpark and transitioning batch processing workflows to Google Cloud BigQuery + GCP, improving maintainability, scalability, and distributed data processing performance.
 
Senior Software Engineer 
American Airlines | Austin, TX
04/2019 - 10/2021
•	Build and maintain GraphQL APIs that provide operations teams with a consolidated, real-time view of airline operational data across American Airlines’ global network.
•	Architect high-throughput streaming data pipelines using Apache Kafka to ingest and process 500K events daily from multiple upstream systems. Designed resilient ingestion and transformation workflows to support near real-time operational visibility and analytics.
•	Improved end-to-end message processing latency from 5 seconds to under 2 seconds by optimizing Kafka consumers, asynchronous processing patterns, and message serialization strategies, enabling real-time cargo tracking across the network.
•	Architected event-driven microservices using Java 17/Spring Boot for real-time AVRO/JSON message processing. System automatically retries failed messages and alerts on-call engineers, cutting manual intervention by 60%.
•	Migrated 6 legacy services to Azure cloud (Event Hubs, Key Vault, Blob Storage), reducing infrastructure costs 25% while handling 3x the traffic. Designed for failure—services stay up even when dependencies go down.
•	Built integrations with external cargo partners using IBM MQ, REST APIs, and Microsoft Graph API. Handles data exchange for 50+ daily international flights without manual intervention.
•	Established CI/CD pipeline with GitHub Actions and Azure DevOps that reduced deployment time from 2 hours to 15 minutes. Deployments went from monthly nail-biters to daily non-events.
•	Optimize NoSQL database query performance, resolving latency bottlenecks and data access inefficiencies in mission-critical APIs.
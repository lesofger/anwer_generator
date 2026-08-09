# Resume

Paul Meyer
Senior Software Engineer – AI/ML Systems
 
Principal AI/ML Engineer
Viz.AI
06/2024 – Present
•	Led architecture and development of autonomous LLM agent systems using LangChain and LangGraph, AWS AgentCore with RAG architectures, enabling multi-step reasoning, tool use, and decision-making workflows for information retrieval, knowledge-grounded generation, and structured task automation across complex enterprise datasets.(clinical decision support)
•	Designed and implemented NLP pipelines on EHR data in FHIR format, including text classification, named entity recognition, question answering, and LLM-based RAG systems, leveraging transformer-based architectures(BERT, RoBERTa) for clinical information extraction and retrieval.
•	Developed deep learning models for ECG signal analysis, including classification and waveform delineation tasks to detect cardiac abnormalities, using time-series architectures such as CNNs and sequence models for physiological signal interpretation.
•	Built medical image segmentation pipelines for head CT scans, focusing on bleed detection, measurement extraction, supporting clinical trial recruitment workflows for embolization studies using U-Net based and hybrid segmentation architectures.
•	Supported FDA de-novo submission and clearance for an ECG-based deep learning system for Hypertrophic Cardiomyopathy detection, contributing to model validation, clinical study analysis, performance benchmarking, and interpretability reporting to meet regulatory-grade requirements.
•	Prompt evaluation and optimization pipelines using automated scoring metrics (RAGAS, G-Eval); reduced hallucination rate by 25% and improved response precision on domain-specific queries.
•	LLM observability and LLMOps pipelines tracking token usage, latency, hallucination rate, and response quality in production using MLflow and custom monitoring dashboards.
•	LLM fine-tuning using LoRA on clinical corpora with Hugging Face PEFT; improved entity extraction accuracy on physician notes by 22% over off-the-shelf models.
•	Responsible AI techniques (SHAP, LIME, Fairness Auditing) for explainability, bias detection, and regulatory auditability in clinical decision support models.
•	ETL pipelines for HL7 and FHIR data integration, ingesting real-time clinical feeds from hospital information systems into Snowflake for analytics.
•	Built enterprise knowledge discovery solutions leveraging Amazon Bedrock, vector search, and conversational AI capabilities for clinical documentation and operational insights.
•	Implemented Responsible AI practices including explainability, bias mitigation, audit logging, governance controls, and human-in-the-loop validation for enterprise healthcare AI systems.
•	Vector search systems using FAISS, Pinecone, and Amazon OpenSearch Service with hybrid retrieval for fast, accurate retrieval of clinical guidelines and patient-relevant medical literature.
•	MLOps infrastructure (AWS ECS, Airflow, MLflow, Redshift), which supports real time model fine tuning, versioning, deployment and monitoring of 50+ unique production models including centralized experiment tracking, reproducibility, and deployment automation. 
•	A/B experiments on clinical intervention models to validate statistical significance of model-driven care recommendations against standard of care baselines.
•	FastAPI microservices exposing ML models for real-time risk scoring and clinical decision support, deployed on Azure Kubernetes Service (AKS) with auto-scaling.
•	Implemented secure API access patterns using AWS Secrets Manager, IAM Roles, and Amazon API Gateway rate limiting to protect enterprise AI services and ensure scalable, controlled access.
•	HIPAA, HITECH, and GDPR across all AI and data pipelines, implementing data masking, audit logging, and role-based access controls.
 
Senior Machine Learning Engineer 
Box
11/2021 – 05/2024
•	Engineered high-performance document processing pipeline for RAG applications, handling PDFs, images, HTML, and Word documents using PyTorch, computer vision models (YOLOX, YOLO-NAS, DetectronZ), and GPU – accelerated OCR, scaling to 100K+ documents daily with enterprise-grade reliability.
•	Developed scalable Retrieval-Augmented Generation (RAG) systems for Box.AI to connect enterprise unstructured data with LLMs. Improved retrieval quality and inference efficiency through embedding model evaluation, vector database recall benchmarking, prompt engineering, and adaptive text chunking strategies.
•	Built AI-augmented engineering workflows and copilots leveraging GPT-4, LangChain, and Azure OpenAI to automate document analysis, troubleshooting, and operational decision support.
•	Evaluation of RAG systems is highly dependent on the context of the query and corpus. I implemented an evaluation set and testing framework for Box.AI that is more representative and diverse than the standard benchmark datasets. The queries and documents included are closer proxies in size and complexity to real customer use cases. This allowed the Box.AI team to more effectively prompt tune, examine throughput, debug corner cases, and perform regression tests when pushing changes.
•	Trained and deployed a large-scale TensorFlow Ranking (TF-Ranking) model powering enterprise search relevance for 1+ years, delivering a +4% NDCG improvement across high-volume user search traffic.
•	Optimized Apache Solr ranking and boost strategies to prioritize freshness-aware retrieval, increasing recall of recently updated content and improving Quick Search NDCG by over 5%.
•	Developed KPI tracking frameworks and executive dashboards for sales, inventory, customer engagement, and operational performance analysis using Python, SQL, Tableau, and Power BI.
•	Streamlined infrastructure provisioning using Terraform, CloudFormation, and Ansible, implementing Python based automation and DevOps practices with infrastructure-as-code to reduce human errors by 60% across AWS and on-premise environments, deploying to Kubernetes.
•	Built and optimized data pipelines to transform financial data across banking platforms, payment gateways, and regulatory tools for 50–100 datasets, providing internal consulting on data governance and risk assessment strategies
•	Revamped the team’s data engineering infrastructure by migrating legacy ETL pipelines to Python 3 / PySpark and transitioning batch processing workflows to Google Cloud BigQuery + GCP, improving maintainability, scalability, and distributed data processing performance.
 
Senior Software Engineer 
American Airlines
04/2019 - 10/2021
•	Build and maintain GraphQL APIs that provide operations teams with a consolidated, real-time view of airline operational data across American Airlines’ global network.
•	Architect high-throughput streaming data pipelines using Apache Kafka to ingest and process 500K events daily from multiple upstream systems. Designed resilient ingestion and transformation workflows to support near real-time operational visibility and analytics.
•	Improved end-to-end message processing latency from 5 seconds to under 2 seconds by optimizing Kafka consumers, asynchronous processing patterns, and message serialization strategies, enabling real-time cargo tracking across the network.
•	Architected event-driven microservices using Java 17/Spring Boot for real-time AVRO/JSON message processing. System automatically retries failed messages and alerts on-call engineers, cutting manual intervention by 60%.
•	Migrated 6 legacy services to Azure cloud (Event Hubs, Key Vault, Blob Storage), reducing infrastructure costs 25% while handling 3x the traffic. Designed for failure—services stay up even when dependencies go down.
•	Built integrations with external cargo partners using IBM MQ, REST APIs, and Microsoft Graph API. Handles data exchange for 50+ daily international flights without manual intervention.
•	Established CI/CD pipeline with GitHub Actions and Azure DevOps that reduced deployment time from 2 hours to 15 minutes. Deployments went from monthly nail-biters to daily non-events.
•	Optimize NoSQL database query performance, resolving latency bottlenecks and data access inefficiencies in mission-critical APIs.
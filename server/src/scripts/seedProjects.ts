import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { Project } from '../models/Project';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

const projectSeedData = [
  {
    title: 'AI-Powered E-Commerce Platform',
    slug: 'ai-ecommerce-platform',
    domainSlug: 'full-stack-development',
    category: 'SaaS',
    difficulty: 'Intermediate',
    description: 'An end-to-end multi-tenant e-commerce platform with AI-driven product recommendations and vector search.',
    problemStatement: 'Modern e-commerce requires fast search and highly personalized recommendations. Building a Next.js application that integrates standard checkout workflows with vector database similarity searches solves both scalability and user conversion problems.',
    estimatedTime: '24 Hours',
    skills: ['Next.js App Router', 'Payment Gateway Integration', 'Vector Search', 'NoSQL Modeling'],
    technologies: ['Next.js', 'Express', 'MongoDB', 'Gemini AI', 'Stripe', 'Tailwind CSS'],
    tags: ['Web', 'SaaS', 'AI'],
    featured: true,
    prerequisites: ['Basic React', 'Understanding of REST APIs'],
    popularity: 95
  },
  {
    title: 'Autonomous RAG Knowledge Assistant',
    slug: 'rag-document-chat',
    domainSlug: 'generative-ai',
    category: 'AI',
    difficulty: 'Advanced',
    description: 'A conversational agent that reads uploaded PDF documents and answers complex queries with accurate source citations.',
    problemStatement: 'LLMs hallucinate. Giving them grounding through Retrieval-Augmented Generation (RAG) is the industry standard for production AI apps. This project requires passing documents through an embedding pipeline into a vector store, then orchestrating user queries.',
    estimatedTime: '18 Hours',
    skills: ['Embeddings', 'LangChain Orchestration', 'Prompt Engineering', 'Document Chunking'],
    technologies: ['Python', 'FastAPI', 'LangChain', 'Pinecone', 'OpenAI'],
    tags: ['AI', 'API'],
    featured: true,
    prerequisites: ['Python Fundamentals', 'Basic API Concepts'],
    popularity: 88
  },
  {
    title: 'Scalable Microservices Gateway',
    slug: 'scalable-microservices-gateway',
    domainSlug: 'cloud-computing',
    category: 'Industry',
    difficulty: 'Advanced',
    description: 'An API Gateway for a distributed microservice architecture featuring rate limiting, Redis caching, and circuit breakers.',
    problemStatement: 'Monolithic architectures fail at scale due to tight coupling. By abstracting routing logic into a reverse proxy/gateway layer, backend services can scale independently. Implementing this gives visibility into real-world DevOps/Backend system design.',
    estimatedTime: '32 Hours',
    skills: ['System Design', 'Redis Caching', 'Event Brokers', 'Dockerization'],
    technologies: ['Node.js', 'Redis', 'Docker', 'Nginx', 'Kafka'],
    tags: ['API', 'Industry'],
    featured: false,
    prerequisites: ['Advanced Node.js', 'Docker Basics'],
    popularity: 70
  },
  {
    title: 'Real-time Collaborative Whiteboard',
    slug: 'collaborative-whiteboard',
    domainSlug: 'full-stack-development',
    category: 'Web',
    difficulty: 'Intermediate',
    description: 'A shared infinite canvas where multiple users can draw, drag, and collaborate instantly across clients.',
    problemStatement: 'Handling low-latency state synchronization across concurrent clients is a classic frontend scaling challenge. Implementing WebSockets alongside a spatial canvas teaches advanced state management and race-condition mitigation.',
    estimatedTime: '20 Hours',
    skills: ['WebSocket Communication', 'Canvas API', 'Operational Transformation'],
    technologies: ['React', 'Socket.io', 'Node.js', 'HTML5 Canvas', 'Redis'],
    tags: ['Web', 'Industry'],
    featured: true,
    prerequisites: ['Intermediate React hooks', 'Asynchronous JS'],
    popularity: 90
  },
  {
    title: 'Predictive Churn Analytics Dashboard',
    slug: 'churn-analytics-dashboard',
    domainSlug: 'data-science',
    category: 'Industry',
    difficulty: 'Intermediate',
    description: 'End-to-end data pipeline identifying at-risk customers analyzing telemetry, support tickets, and billing histories.',
    problemStatement: 'Acquisition is more expensive than retention. Data Analysts must aggregate multi-source data, build a transparent prediction model (like XGBoost or Logistic Regression), and expose the insights intuitively to stakeholders via a dashboard.',
    estimatedTime: '15 Hours',
    skills: ['Data Wrangling', 'Classification Metrics', 'Dashboarding'],
    technologies: ['Python', 'Pandas', 'Scikit-Learn', 'Streamlit', 'PostgreSQL'],
    tags: ['AI', 'Industry'],
    featured: false,
    prerequisites: ['Python basics', 'Basic stats/probability'],
    popularity: 75
  },
  {
    title: 'Defensive Firewall & Traffic Analyzer',
    slug: 'defensive-firewall',
    domainSlug: 'cybersecurity',
    category: 'Industry',
    difficulty: 'Beginner',
    description: 'A packet sniffing utility capturing live network traffic and matching it against known malicious IP signatures.',
    problemStatement: 'Understanding the OSI model is essential for security engineering. Building a raw socket analyzer that traps anomalies gives foundational exposure to infosec practices without relying on complex Enterprise SIEM platforms.',
    estimatedTime: '10 Hours',
    skills: ['Packet Analysis', 'Networking Protocols (TCP/IP)', 'Signature Matching'],
    technologies: ['Python', 'Scapy', 'Wireshark concepts'],
    tags: ['Industry'],
    featured: false,
    prerequisites: ['Basic Terminal Usage', 'Python Scripting'],
    popularity: 65
  },
];

const seed = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse';
  await mongoose.connect(connStr);
  console.log('[Seed] Connected for Projects');

  let added = 0;
  let updated = 0;

  for (const proj of projectSeedData) {
    const result = await Project.updateOne(
      { slug: proj.slug },
      { $set: proj },
      { upsert: true }
    );
    if (result.upsertedCount) added++;
    else updated++;
  }

  console.log(`[Seed Project] Done: +${added} new, ~${updated} updated out of ${projectSeedData.length}`);
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

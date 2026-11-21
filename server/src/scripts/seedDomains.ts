import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { Domain } from '../models/Domain';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

const seedData = [
  // AI
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Intelligent systems & autonomous reasoning', category: 'AI', icon: 'Brain', skills: ['Algorithms', 'Logic', 'Search', 'Optimization'], technologies: ['Python', 'SciPy', 'Prolog'], difficulty: 'Advanced', careerRoles: ['AI Research Scientist', 'AI Engineer'] },
  { name: 'Machine Learning', slug: 'machine-learning', description: 'Statistical learning & predictive models', category: 'AI', icon: 'Brain', skills: ['Statistics', 'Linear Algebra', 'Model Evaluation'], technologies: ['Python', 'Scikit-learn', 'TensorFlow'], difficulty: 'Intermediate', careerRoles: ['Machine Learning Engineer', 'Data Scientist'] },
  { name: 'Deep Learning', slug: 'deep-learning', description: 'Neural networks & representation learning', category: 'AI', icon: 'Brain', skills: ['Neural Networks', 'Backpropagation'], technologies: ['PyTorch', 'Keras', 'CUDA'], difficulty: 'Advanced', careerRoles: ['Deep Learning Engineer'] },
  { name: 'Generative AI', slug: 'generative-ai', description: 'Content synthesis & creative AI models', category: 'AI', icon: 'Sparkles', skills: ['Prompt Engineering', 'GANs', 'Diffusion Models'], technologies: ['OpenAI API', 'Hugging Face', 'LangChain'], difficulty: 'Intermediate', careerRoles: ['GenAI Developer', 'Creative Technologist'] },
  { name: 'LLMs', slug: 'llms', description: 'Large language models & foundation systems', category: 'AI', icon: 'MessageSquare', skills: ['Fine-tuning', 'RAG', 'Vector DBs'], technologies: ['Pinecone', 'Transformers', 'LlamaIndex'], difficulty: 'Advanced', careerRoles: ['LLM Engineer', 'AI Architect'] },
  { name: 'NLP', slug: 'nlp', description: 'Text analysis, understanding & generation', category: 'AI', icon: 'MessageSquare', skills: ['Tokenization', 'Sentiment Analysis', 'NER'], technologies: ['NLTK', 'spaCy', 'BERT'], difficulty: 'Intermediate', careerRoles: ['NLP Engineer'] },
  { name: 'Computer Vision', slug: 'computer-vision', description: 'Image & video perception systems', category: 'AI', icon: 'Eye', skills: ['Object Detection', 'Image Segmentation'], technologies: ['OpenCV', 'YOLO', 'PyTorch'], difficulty: 'Advanced', careerRoles: ['Computer Vision Engineer'] },
  // Data
  { name: 'Data Science', slug: 'data-science', description: 'Insights from structured & unstructured data', category: 'Data', icon: 'BarChart3', skills: ['Hypothesis Testing', 'A/B Testing', 'Data Wrangling'], technologies: ['Python', 'Pandas', 'Jupyter', 'R'], difficulty: 'Intermediate', careerRoles: ['Data Scientist', 'Quantitative Analyst'] },
  { name: 'Data Analytics', slug: 'data-analytics', description: 'Exploratory analysis & dashboards', category: 'Data', icon: 'PieChart', skills: ['Visualization', 'Reporting', 'SQL'], technologies: ['Tableau', 'PowerBI', 'SQL', 'Excel'], difficulty: 'Beginner', careerRoles: ['Data Analyst', 'Product Analyst'] },
  { name: 'Data Engineering', slug: 'data-engineering', description: 'Pipelines, ETL, and warehouse architecture', category: 'Data', icon: 'Database', skills: ['ETL Pipelines', 'Data Modeling'], technologies: ['Apache Spark', 'Airflow', 'Snowflake', 'Kafka'], difficulty: 'Advanced', careerRoles: ['Data Engineer', 'Big Data Developer'] },
  { name: 'Business Intelligence', slug: 'business-intelligence', description: 'KPI reporting & executive decision support', category: 'Data', icon: 'TrendingUp', skills: ['Dashboard Design', 'KPI Frameworks'], technologies: ['Looker', 'Tableau', 'dbt'], difficulty: 'Beginner', careerRoles: ['BI Analyst', 'Analytics Manager'] },
  // Development
  { name: 'Full Stack Development', slug: 'full-stack-development', description: 'End-to-end web application engineering', category: 'Development', icon: 'Code2', skills: ['Frontend UI', 'Backend APIs', 'Database Design', 'Auth'], technologies: ['React', 'Next.js', 'Node.js', 'TypeScript', 'MongoDB'], difficulty: 'Intermediate', careerRoles: ['Full Stack Developer', 'Software Engineer'] },
  { name: 'Mobile App Development', slug: 'mobile-app-development', description: 'iOS, Android & cross-platform apps', category: 'Development', icon: 'Smartphone', skills: ['Mobile UI/UX', 'State Management', 'Offline Storage'], technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin'], difficulty: 'Intermediate', careerRoles: ['Mobile Engineer', 'iOS/Android Developer'] },
  { name: 'Desktop Development', slug: 'desktop-development', description: 'Native desktop application architecture', category: 'Development', icon: 'Monitor', skills: ['GUI Frameworks', 'OS APIs'], technologies: ['Electron', 'Tauri', 'Qt', '.NET'], difficulty: 'Intermediate', careerRoles: ['Desktop Developer', 'Application Engineer'] },
];

const seed = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse';
  await mongoose.connect(connStr);
  console.log('[Seed] Connected');

  let added = 0;
  let updated = 0;
  for (const d of seedData) {
    const result = await Domain.updateOne({ slug: d.slug }, { $set: d }, { upsert: true });
    if (result.upsertedCount) added++;
    else updated++;
  }
  console.log(`[Seed] Done: +${added} new, ~${updated} updated out of ${seedData.length}`);
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });

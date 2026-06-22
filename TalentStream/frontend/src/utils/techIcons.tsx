import React from 'react';
import {
   SiJavascript, SiTypescript, SiPython, SiCplusplus, SiGo, SiRust, SiKotlin, SiSwift, SiPhp, SiRuby, SiScala, SiR, SiDart, SiGnubash,
   SiReact, SiNextdotjs, SiAngular, SiVuedotjs, SiSvelte, SiHtml5, SiTailwindcss, SiBootstrap, SiRedux,
   SiNodedotjs, SiExpress, SiNestjs, SiSpringboot, SiHibernate, SiDotnet, SiDjango, SiFlask, SiFastapi, SiLaravel, SiRubyonrails,
   SiPostgresql, SiMysql, SiMongodb, SiRedis, SiApachecassandra, SiFirebase,
   SiDocker, SiKubernetes, SiTerraform, SiJenkins, SiGithubactions, SiGitlab, SiHelm, SiNginx, SiAnsible,
   SiApachekafka, SiRabbitmq,
   SiOpenai, SiHuggingface, SiTensorflow, SiPytorch, SiScikitlearn, SiKeras, SiMlflow,
   SiAndroid, SiIos, SiFlutter,
   SiPytest, SiSelenium, SiCypress, SiJest,
   SiGraphql, SiSwagger, SiPostman,
   SiGrafana, SiPrometheus, SiDatadog, SiSplunk,
   SiJsonwebtokens,
   SiGit, SiGithub, SiBitbucket, SiJira, SiConfluence,
   SiApachespark, SiApachehadoop, SiApacheairflow, SiDatabricks, SiSnowflake, SiApachehive, SiApacheflink,
   SiLinux, SiUbuntu, SiRedhat
} from 'react-icons/si';
import { FaAws, FaJava, FaWindows, FaCss3 } from 'react-icons/fa';
import { Cloud, Code, Database, Server, Smartphone, Cpu, Activity, Car, Shield, Wrench, Network, Layout, FileJson } from 'lucide-react';

interface IconConfig {
   icon: React.ReactNode;
   aliases?: string[];
}

const techMapping: Record<string, IconConfig> = {
   // Programming Languages
   java: { icon: <FaJava className="w-3 h-3 text-[#5382a1]" />, aliases: ['java8', 'java11', 'java17'] },
   python: { icon: <SiPython className="w-3 h-3 text-[#3776AB]" />, aliases: ['py', 'python3'] },
   javascript: { icon: <SiJavascript className="w-3 h-3 text-[#F7DF1E]" />, aliases: ['js', 'es6', 'vanillajs'] },
   typescript: { icon: <SiTypescript className="w-3 h-3 text-[#3178C6]" />, aliases: ['ts'] },
   c: { icon: <SiCplusplus className="w-3 h-3 text-[#A8B9CC]" /> }, // Fallback to c++ icon for general C styling
   'c++': { icon: <SiCplusplus className="w-3 h-3 text-[#00599C]" />, aliases: ['cpp'] },
   'c#': { icon: <Code className="w-3 h-3 text-[#239120]" />, aliases: ['csharp'] },
   go: { icon: <SiGo className="w-3 h-3 text-[#00ADD8]" />, aliases: ['golang'] },
   rust: { icon: <SiRust className="w-3 h-3 text-[#000000] dark:text-white" /> },
   kotlin: { icon: <SiKotlin className="w-3 h-3 text-[#7F52FF]" /> },
   swift: { icon: <SiSwift className="w-3 h-3 text-[#FA7343]" /> },
   php: { icon: <SiPhp className="w-3 h-3 text-[#777BB4]" /> },
   ruby: { icon: <SiRuby className="w-3 h-3 text-[#CC342D]" /> },
   scala: { icon: <SiScala className="w-3 h-3 text-[#DC322F]" /> },
   r: { icon: <SiR className="w-3 h-3 text-[#276DC3]" /> },
   dart: { icon: <SiDart className="w-3 h-3 text-[#0175C2]" /> },
   bash: { icon: <SiGnubash className="w-3 h-3 text-[#4EAA25]" />, aliases: ['shell', 'sh', 'zsh'] },
   
   // Frontend
   react: { icon: <SiReact className="w-3 h-3 text-[#61DAFB]" />, aliases: ['reactjs', 'react.js'] },
   nextjs: { icon: <SiNextdotjs className="w-3 h-3 text-[#000000] dark:text-white" />, aliases: ['next', 'next.js'] },
   angular: { icon: <SiAngular className="w-3 h-3 text-[#DD0031]" />, aliases: ['angularjs', 'angular.js'] },
   vue: { icon: <SiVuedotjs className="w-3 h-3 text-[#4FC08D]" />, aliases: ['vuejs', 'vue.js'] },
   svelte: { icon: <SiSvelte className="w-3 h-3 text-[#FF3E00]" /> },
   html: { icon: <SiHtml5 className="w-3 h-3 text-[#E34F26]" />, aliases: ['html5'] },
   css: { icon: <FaCss3 className="w-3 h-3 text-[#1572B6]" />, aliases: ['css3'] },
   tailwind: { icon: <SiTailwindcss className="w-3 h-3 text-[#06B6D4]" />, aliases: ['tailwindcss'] },
   bootstrap: { icon: <SiBootstrap className="w-3 h-3 text-[#7952B3]" /> },
   mui: { icon: <Layout className="w-3 h-3 text-[#007FFF]" />, aliases: ['material ui', 'material-ui', 'materialui'] },
   redux: { icon: <SiRedux className="w-3 h-3 text-[#764ABC]" /> },
   
   // Backend
   node: { icon: <SiNodedotjs className="w-3 h-3 text-[#339933]" />, aliases: ['nodejs', 'node.js'] },
   express: { icon: <SiExpress className="w-3 h-3 text-[#000000] dark:text-white" />, aliases: ['expressjs', 'express.js'] },
   nestjs: { icon: <SiNestjs className="w-3 h-3 text-[#E0234E]" />, aliases: ['nest', 'nest.js'] },
   springboot: { icon: <SiSpringboot className="w-3 h-3 text-[#6DB33F]" />, aliases: ['spring', 'spring boot'] },
   hibernate: { icon: <SiHibernate className="w-3 h-3 text-[#59666C]" /> },
   dotnet: { icon: <SiDotnet className="w-3 h-3 text-[#512BD4]" />, aliases: ['.net', 'asp.net', '.net core', 'dotnet core'] },
   django: { icon: <SiDjango className="w-3 h-3 text-[#092E20] dark:text-[#44B78B]" /> },
   flask: { icon: <SiFlask className="w-3 h-3 text-[#000000] dark:text-white" /> },
   fastapi: { icon: <SiFastapi className="w-3 h-3 text-[#009688]" /> },
   laravel: { icon: <SiLaravel className="w-3 h-3 text-[#FF2D20]" /> },
   rails: { icon: <SiRubyonrails className="w-3 h-3 text-[#CC0000]" />, aliases: ['ruby on rails', 'ror'] },
   gin: { icon: <Server className="w-3 h-3 text-[#00ADD8]" /> },
   quarkus: { icon: <Server className="w-3 h-3 text-[#4695EB]" /> },
   
   // Databases
   postgresql: { icon: <SiPostgresql className="w-3 h-3 text-[#4169E1]" />, aliases: ['postgres', 'psql'] },
   mysql: { icon: <SiMysql className="w-3 h-3 text-[#4479A1]" /> },
   mongodb: { icon: <SiMongodb className="w-3 h-3 text-[#47A248]" />, aliases: ['mongo'] },
   redis: { icon: <SiRedis className="w-3 h-3 text-[#DC382D]" /> },
   oracle: { icon: <Database className="w-3 h-3 text-[#F00000]" /> },
   sqlserver: { icon: <Database className="w-3 h-3 text-[#CC292B]" />, aliases: ['mssql', 'sql server'] },
   cassandra: { icon: <SiApachecassandra className="w-3 h-3 text-[#1287B1]" /> },
   dynamodb: { icon: <Database className="w-3 h-3 text-[#4053D6]" />, aliases: ['dynamo'] },
   firebase: { icon: <SiFirebase className="w-3 h-3 text-[#FFCA28]" /> },
   neo4j: { icon: <Database className="w-3 h-3 text-[#008CC1]" /> },
   
   // Cloud
   aws: { icon: <FaAws className="w-3 h-3 text-[#FF9900]" />, aliases: ['amazon web services'] },
   azure: { icon: <Cloud className="w-3 h-3 text-[#0089D6]" />, aliases: ['microsoft azure'] },
   gcp: { icon: <Cloud className="w-3 h-3 text-[#4285F4]" />, aliases: ['google cloud', 'google cloud platform'] },
   
   // DevOps
   docker: { icon: <SiDocker className="w-3 h-3 text-[#2496ED]" /> },
   kubernetes: { icon: <SiKubernetes className="w-3 h-3 text-[#326CE5]" />, aliases: ['k8s'] },
   terraform: { icon: <SiTerraform className="w-3 h-3 text-[#844FBA]" />, aliases: ['tf'] },
   jenkins: { icon: <SiJenkins className="w-3 h-3 text-[#D24939]" /> },
   githubactions: { icon: <SiGithubactions className="w-3 h-3 text-[#2088FF]" />, aliases: ['github actions'] },
   gitlabci: { icon: <SiGitlab className="w-3 h-3 text-[#FC6D26]" />, aliases: ['gitlab ci/cd', 'gitlab ci'] },
   helm: { icon: <SiHelm className="w-3 h-3 text-[#0F1689]" /> },
   nginx: { icon: <SiNginx className="w-3 h-3 text-[#009639]" /> },
   ansible: { icon: <SiAnsible className="w-3 h-3 text-[#EE0000]" /> },
   
   // Messaging
   kafka: { icon: <SiApachekafka className="w-3 h-3 text-[#231F20] dark:text-white" /> },
   rabbitmq: { icon: <SiRabbitmq className="w-3 h-3 text-[#FF6600]" /> },
   activemq: { icon: <Network className="w-3 h-3 text-[#D22128]" /> },
   sqs: { icon: <Network className="w-3 h-3 text-[#FF9900]" /> },
   sns: { icon: <Network className="w-3 h-3 text-[#FF9900]" /> },
   
   // AI/ML
   openai: { icon: <SiOpenai className="w-3 h-3 text-[#412991] dark:text-white" />, aliases: ['gpt', 'chatgpt'] },
   langchain: { icon: <Network className="w-3 h-3 text-[#121212] dark:text-white" /> },
   langgraph: { icon: <Network className="w-3 h-3 text-[#121212] dark:text-white" /> },
   huggingface: { icon: <SiHuggingface className="w-3 h-3 text-[#FFD21E]" />, aliases: ['hugging face'] },
   tensorflow: { icon: <SiTensorflow className="w-3 h-3 text-[#FF6F00]" />, aliases: ['tf'] },
   pytorch: { icon: <SiPytorch className="w-3 h-3 text-[#EE4C2C]" /> },
   scikitlearn: { icon: <SiScikitlearn className="w-3 h-3 text-[#F7931E]" />, aliases: ['scikit-learn', 'sklearn'] },
   keras: { icon: <SiKeras className="w-3 h-3 text-[#D00000]" /> },
   mlflow: { icon: <SiMlflow className="w-3 h-3 text-[#0194E2]" /> },
   ollama: { icon: <Cpu className="w-3 h-3 text-[#000000] dark:text-white" /> },
   rag: { icon: <Network className="w-3 h-3 text-[#6366f1]" />, aliases: ['retrieval augmented generation'] },
   
   // Vector DBs
   pinecone: { icon: <Database className="w-3 h-3 text-[#000000] dark:text-white" /> },
   qdrant: { icon: <Database className="w-3 h-3 text-[#FF2E4B]" /> },
   weaviate: { icon: <Database className="w-3 h-3 text-[#22C55E]" /> },
   chroma: { icon: <Database className="w-3 h-3 text-[#FF5A00]" />, aliases: ['chromadb'] },
   milvus: { icon: <Database className="w-3 h-3 text-[#009DE0]" /> },
   faiss: { icon: <Database className="w-3 h-3 text-[#1E3A8A]" /> },
   
   // Mobile
   android: { icon: <SiAndroid className="w-3 h-3 text-[#3DDC84]" /> },
   ios: { icon: <SiIos className="w-3 h-3 text-[#000000] dark:text-white" /> },
   flutter: { icon: <SiFlutter className="w-3 h-3 text-[#02569B]" /> },
   reactnative: { icon: <SiReact className="w-3 h-3 text-[#61DAFB]" />, aliases: ['react native'] },
   
   // Testing
   pytest: { icon: <SiPytest className="w-3 h-3 text-[#0A9EDC]" /> },
   selenium: { icon: <SiSelenium className="w-3 h-3 text-[#43B02A]" /> },
   cypress: { icon: <SiCypress className="w-3 h-3 text-[#17202C] dark:text-white" /> },
   playwright: { icon: <Wrench className="w-3 h-3 text-[#2EAD33]" /> },
   jest: { icon: <SiJest className="w-3 h-3 text-[#C21325]" /> },
   junit: { icon: <Wrench className="w-3 h-3 text-[#25A162]" /> },
   testng: { icon: <Wrench className="w-3 h-3 text-[#1A457B]" /> },
   cucumber: { icon: <Wrench className="w-3 h-3 text-[#23D96C]" /> },
   
   // API
   rest: { icon: <Network className="w-3 h-3 text-[#007ACC]" />, aliases: ['rest api', 'restful'] },
   graphql: { icon: <SiGraphql className="w-3 h-3 text-[#E10098]" /> },
   grpc: { icon: <Network className="w-3 h-3 text-[#244C5A]" /> },
   swagger: { icon: <SiSwagger className="w-3 h-3 text-[#85EA2D]" /> },
   postman: { icon: <SiPostman className="w-3 h-3 text-[#FF6C37]" /> },
   
   // Monitoring
   grafana: { icon: <SiGrafana className="w-3 h-3 text-[#F46800]" /> },
   prometheus: { icon: <SiPrometheus className="w-3 h-3 text-[#E6522C]" /> },
   elk: { icon: <Activity className="w-3 h-3 text-[#005571]" />, aliases: ['elk stack', 'elasticsearch', 'logstash', 'kibana'] },
   datadog: { icon: <SiDatadog className="w-3 h-3 text-[#632CA6]" /> },
   splunk: { icon: <SiSplunk className="w-3 h-3 text-[#000000] dark:text-white" /> },
   newrelic: { icon: <Activity className="w-3 h-3 text-[#008C99]" />, aliases: ['new relic'] },
   
   // Security
   oauth: { icon: <Shield className="w-3 h-3 text-[#3D3D3D]" /> },
   jwt: { icon: <SiJsonwebtokens className="w-3 h-3 text-[#000000] dark:text-white" /> },
   keycloak: { icon: <Shield className="w-3 h-3 text-[#111827]" /> },
   openid: { icon: <Shield className="w-3 h-3 text-[#F78C40]" />, aliases: ['openid connect', 'oidc'] },
   vault: { icon: <Shield className="w-3 h-3 text-[#000000] dark:text-white" /> },
   
   // Collaboration
   git: { icon: <SiGit className="w-3 h-3 text-[#F05032]" /> },
   github: { icon: <SiGithub className="w-3 h-3 text-[#181717] dark:text-white" /> },
   gitlab: { icon: <SiGitlab className="w-3 h-3 text-[#FC6D26]" /> },
   bitbucket: { icon: <SiBitbucket className="w-3 h-3 text-[#0052CC]" /> },
   jira: { icon: <SiJira className="w-3 h-3 text-[#0052CC]" /> },
   confluence: { icon: <SiConfluence className="w-3 h-3 text-[#172B4D]" /> },
   
   // Data Eng
   spark: { icon: <SiApachespark className="w-3 h-3 text-[#E25A1C]" /> },
   hadoop: { icon: <SiApachehadoop className="w-3 h-3 text-[#FFDF00]" /> },
   airflow: { icon: <SiApacheairflow className="w-3 h-3 text-[#017CEE]" /> },
   databricks: { icon: <SiDatabricks className="w-3 h-3 text-[#FF3621]" /> },
   snowflake: { icon: <SiSnowflake className="w-3 h-3 text-[#29B5E8]" /> },
   hive: { icon: <SiApachehive className="w-3 h-3 text-[#FDEE21]" /> },
   flink: { icon: <SiApacheflink className="w-3 h-3 text-[#E6522C]" /> },
   
   // OS
   linux: { icon: <SiLinux className="w-3 h-3 text-[#FCC624]" /> },
   ubuntu: { icon: <SiUbuntu className="w-3 h-3 text-[#E95420]" /> },
   windows: { icon: <FaWindows className="w-3 h-3 text-[#0078D6]" /> },
   redhat: { icon: <SiRedhat className="w-3 h-3 text-[#EE0000]" /> },
   
   // Architecture
   microservices: { icon: <Network className="w-3 h-3 text-[#6366f1]" /> },
   distributed: { icon: <Network className="w-3 h-3 text-[#6366f1]" />, aliases: ['distributed systems'] },
   eventdriven: { icon: <Activity className="w-3 h-3 text-[#6366f1]" />, aliases: ['event driven architecture', 'eda'] },
   systemdesign: { icon: <Layout className="w-3 h-3 text-[#6366f1]" />, aliases: ['system design'] },
   
   // Auto
   can: { icon: <Car className="w-3 h-3 text-[#1E293B] dark:text-white" />, aliases: ['can fd', 'can-fd'] },
   someip: { icon: <Network className="w-3 h-3 text-[#1E293B] dark:text-white" />, aliases: ['some/ip'] },
   autosar: { icon: <Car className="w-3 h-3 text-[#1E293B] dark:text-white" /> },
   canoe: { icon: <Wrench className="w-3 h-3 text-[#1E293B] dark:text-white" />, aliases: ['canalyzer'] },
   uds: { icon: <Activity className="w-3 h-3 text-[#1E293B] dark:text-white" />, aliases: ['doip'] },
   ecutesting: { icon: <Cpu className="w-3 h-3 text-[#1E293B] dark:text-white" />, aliases: ['ecu testing', 'ecu'] },
};

// Flatten map for fast O(1) lookup
const lookupMap = new Map<string, React.ReactNode>();

Object.entries(techMapping).forEach(([key, config]) => {
   lookupMap.set(key.toLowerCase(), config.icon);
   if (config.aliases) {
      config.aliases.forEach(alias => lookupMap.set(alias.toLowerCase(), config.icon));
   }
});

export const getTechIcon = (skill: string) => {
   const normalized = skill.toLowerCase().trim();
   
   // Exact lookup
   if (lookupMap.has(normalized)) {
      return lookupMap.get(normalized);
   }

   // Partial generic matching
   for (const [key, icon] of lookupMap.entries()) {
      // Prioritize full word matches within strings to avoid false positives (e.g., 'java' in 'javascript')
      // For short keys, we must match it carefully.
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundaryRegex = new RegExp(`(^|[^a-z0-9])${escapedKey}([^a-z0-9]|$)`, 'i');
      if (boundaryRegex.test(normalized)) {
         return icon;
      }
   }
   
   // Fallback secondary matching for partial strings if boundary fails
   // e.g. "awscloud" containing "aws"
   for (const [key, icon] of lookupMap.entries()) {
      if (key.length >= 4 && normalized.includes(key)) {
         return icon;
      }
   }

   // Generic fallback icon
   return <Code className="w-3 h-3 text-slate-400 dark:text-white/40" />;
};

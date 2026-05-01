// src/schemas/generators.ts

const SITE_URL = "https://serplora.com";

// 1. Global Schema (Injected on EVERY page)
export function getGlobalSchema() {
  return [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Serplora Academy",
      "url": SITE_URL,
      "logo": `${SITE_URL}/images/logo/logo.svg`
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#samarth`,
      "name": "Samarth Upadhyay",
      "jobTitle": "Senior SEO Analyst",
      "url": `${SITE_URL}/about`
    }
  ];
}

// 2. Article / Tutorial Schema
export function getArticleSchema(type: string, data: any, url: string) {
  return {
    "@type": type,
    "@id": `${url}#article`,
    "isPartOf": { "@id": `${SITE_URL}/#website` },
    "author": { "@id": `${SITE_URL}/#samarth` },
    "headline": data.title,
    "description": data.description,
    "datePublished": data.publishDate ? new Date(data.publishDate).toISOString() : undefined,
    "dateModified": data.updatedDate ? new Date(data.updatedDate).toISOString() : undefined,
    "image": data.image ? `${SITE_URL}${data.image}` : undefined,
    "publisher": { "@id": `${SITE_URL}/#organization` },
    "mainEntityOfPage": { "@id": url }
  };
}

// 3. Compiler / Tool Schema
export function getWebAppSchema(data: any, url: string) {
  return {
    "@type": "WebApplication",
    "@id": `${url}#software`,
    "name": data.title,
    "description": data.description,
    "applicationCategory": "DeveloperApplication",
    "browserRequirements": "Requires modern browser with JavaScript",
    "operatingSystem": "All",
    "url": url,
    "creator": { "@id": `${SITE_URL}/#organization` }
  };
}

// 4. Quiz Schema
export function getQuizSchema(data: any, url: string) {
  // Gracefully handle parsed questions if available
  let questions = [];
  try {
     questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []);
  } catch(e) {}

  return {
    "@type": "Quiz",
    "@id": `${url}#quiz`,
    "name": data.title,
    "description": data.description,
    "educationalAlignment": [
      {
        "@type": "AlignmentObject",
        "alignmentType": "educationalSubject",
        "targetName": "Computer Science"
      }
    ],
    "hasPart": questions.length > 0 ? questions.map((q: any) => {
       const correctOpt = q.options.find((o: any) => o.isCorrect);
       return {
         "@type": "Question",
         "eduQuestionType": "Multiple choice",
         "text": q.questionText,
         "acceptedAnswer": {
           "@type": "Answer",
           "text": correctOpt ? correctOpt.text : ""
         },
         "suggestedAnswer": q.options.filter((o: any) => !o.isCorrect).map((o: any) => ({
           "@type": "Answer",
           "text": o.text
         }))
       }
    }) : undefined
  };
}
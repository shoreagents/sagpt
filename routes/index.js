import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain, loadQAStuffChain, SimpleSequentialChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from "langchain/prompts";
import * as fs from 'fs';
import * as dotenv from 'dotenv';

import express from "express";
const router = express.Router()

dotenv.config();

const txtFilename = "gptdata";
const txtPath = `./${txtFilename}.txt`;
const VECTOR_STORE_PATH = `${txtFilename}.index`;

router.get('/', async (req,res) =>{
  res.render('index', { response:"Hi! How may I help you?" })
})
router.post('/', async (req,res) =>{
  const question = req.body.userinput;
  const output = await runWithEmbeddings(question);
  res.send({output})
})

export const runWithEmbeddings = async (question) => {
  const model1 = new OpenAI({temperature:0.7, modelName:"gpt-4"});
  const model2 = new OpenAI({temperature:0.7, modelName:"gpt-4"});

  let vectorStore;
  if (fs.existsSync(VECTOR_STORE_PATH)) {
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  } else {
    const text = fs.readFileSync(txtPath, 'utf8');
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const docs = await textSplitter.createDocuments([text]);
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    await vectorStore.save(VECTOR_STORE_PATH);
  }

  // You are most likely to create a 2000 word blog article. If you are to create an article, then this article should be written with an excited tone.
  
  // Creating an article Instructions:
  //   Target the following keywords: {question}.
  //   Start with creating a Title about {question}.
  //   Make sure to include headings. The headings should be in bold.
  //   Keywords within the content should also be highlighted in bold.

  const promptTemplate = `Create a good article title based on the provided keywords that the user has provided.
  Title: {question}
  Playwright: This is a synopsis for the article:`;

  const outlineTemplate = `Given the title above, create an outline format that is good for a 2000 word article with headings and sub-headings if needed. Start with the title and then the outline
  Use this as a format
  "Title: {question}

  ARTICLE OUTLINE:
  Display the article outline here"`;

  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables: ["question"],
  });

  const prompt2 = new PromptTemplate({
    template: outlineTemplate,
    inputVariables: ["question"]
  });


  const chain1 = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model1, { prompt }),
    retriever: vectorStore.asRetriever(),
  });

  const chain2 = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model2, { prompt: prompt2 }),
    retriever: vectorStore.asRetriever(),
  });


  const allChain = new SimpleSequentialChain({
    chains: [chain1, chain2],
    verbose: true,
  })

  // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  
  // const res = await chain.call({
  //   query: question,
  // });

  const res = await allChain.run(question);

  const output = res;
  console.log(res);
  return output;
};

export default router;
import { DocumentItem } from '../types/index.ts';
import { cleanText, chunkDocument } from '../utils/preprocessor.ts';
import { computeSemanticVector } from '../utils/vectorSearch.ts';

const RAW_DOCUMENTS: Omit<DocumentItem, 'chunks' | 'totalTokens'>[] = [
  {
    id: 'paper-attention',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
    year: 2017,
    category: 'Model Architecture',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    sections: [
      {
        title: 'Model Architecture & Self-Attention',
        content: 'The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.'
      },
      {
        title: 'Scaled Dot-Product Attention & Multi-Head Attention',
        content: 'We compute Scaled Dot-Product Attention as Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V. Instead of performing a single attention function with d_model-dimensional keys, values, and queries, we found it beneficial to linearly project the queries, keys, and values h times with different, learned linear projections to d_k, d_k, and d_v dimensions respectively. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.'
      },
      {
        title: 'Positional Encoding & Complexity',
        content: 'Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add positional encodings to the input embeddings at the bottoms of the encoder and decoder stacks. We use sine and cosine functions of different frequencies. Self-attention layers connect all positions with a constant number of sequentially executed operations, compared to O(n) for recurrent layers.'
      },
      {
        title: 'Empirical Results & BLEU Scores',
        content: 'On the WMT 2014 English-to-German translation task, the big transformer model achieves a state-of-the-art BLEU score of 28.4, outperforming the best existing models including ensembles by more than 2.0 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on 8 GPUs.'
      }
    ],
    referenceSummary: 'Vaswani et al. introduce the Transformer, an encoder-decoder architecture that replaces recurrent and convolutional layers entirely with self-attention and multi-head attention mechanisms. Utilizing scaled dot-product attention and sinusoidal positional encodings, the Transformer enables full sequence parallelization during training, slashing computation time while achieving state-of-the-art translation BLEU scores on WMT benchmarks.'
  },
  {
    id: 'paper-rag',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus', 'Fabio Petroni', 'Vladimir Karpukhin', 'Naman Goyal', 'Heinrich Küttler', 'Mike Lewis', 'Wen-tau Yih', 'Tim Rocktäschel', 'Sebastian Riedel', 'Douwe Kiela'],
    year: 2020,
    category: 'Information Retrieval & RAG',
    abstract: 'Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and they often hallucinate. We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) models which combine pre-trained parametric and non-parametric memory for language generation.',
    sections: [
      {
        title: 'RAG Architecture: Parametric vs Non-Parametric Memory',
        content: 'RAG models leverage a dense retrieval mechanism over a non-parametric corpus, paired with a sequence-to-sequence parametric generator. The retrieval component uses Dense Passage Retrieval (DPR) based on bi-encoder BERT representations to retrieve top-k documents from Wikipedia given query x. The generator is a pre-trained BART model that conditions on both query x and the retrieved documents z to generate target y.'
      },
      {
        title: 'RAG-Sequence vs RAG-Token Models',
        content: 'We propose two formulations: RAG-Sequence uses the same retrieved document to generate the complete target sequence, computing probability by marginalizing across top-k documents. RAG-Token can attend to different retrieved documents at each target token generation step, allowing the generator to blend facts from multiple diverse retrieved passages.'
      },
      {
        title: 'Downstream Evaluation & Open-Domain QA',
        content: 'We evaluate RAG on open-domain question answering benchmarks including Natural Questions, WebQuestions, and CuratedTREC, as well as MS-MARCO and Jeopardy question generation. RAG establishes new state-of-the-art results, generating responses that are more specific, diverse, and factual than purely parametric baseline models like T5 and BART.'
      },
      {
        title: 'Knowledge Updates & Modularity',
        content: 'A major operational advantage of RAG is modularity: as world knowledge changes, the non-parametric document index can be hot-swapped or augmented without costly retraining of the parametric neural weights, significantly mitigating outdated answers and hallucination.'
      }
    ],
    referenceSummary: 'Lewis et al. propose Retrieval-Augmented Generation (RAG), combining a parametric seq2seq model (BART) with a non-parametric neural retriever (DPR over dense Wikipedia embeddings). RAG models (both RAG-Sequence and RAG-Token) dynamically condition text generation on retrieved external documents, establishing new state-of-the-art accuracy in open-domain QA and enabling knowledge base updates without model retraining.'
  },
  {
    id: 'paper-lora',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'],
    year: 2021,
    category: 'Parameter-Efficient Fine-Tuning',
    abstract: 'An important paradigm of natural language processing involves large-scale pre-training on general domain data and adaptation to specific tasks or domains. As we pre-train larger models, full fine-tuning, which retrains all model parameters, becomes less feasible. We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.',
    sections: [
      {
        title: 'The Low-Rank Decomposition Principle',
        content: 'Inspired by the hypothesis that weight updates during adaptation have a low intrinsic dimension, LoRA decomposes the weight update matrix Delta W into the product of two low-rank matrices B and A: Delta W = B * A, where W in R^(d x k), B in R^(d x r), and A in R^(r x k), with rank r << min(d, k). During training, pre-trained weight W_0 is frozen and receives no gradient updates, while only low-rank matrices A and B are trained.'
      },
      {
        title: 'Zero Added Inference Latency',
        content: 'When deployed in production, the trained adapter product Delta W = B * A can be explicitly added into W_0: W_deployed = W_0 + (alpha / r) * B * A. Because the weights are folded back linearly into the base matrices, LoRA introduces zero additional inference latency and no runtime architectural overhead compared to the base model.'
      },
      {
        title: 'Memory Reduction & Parameter Efficiency',
        content: 'LoRA reduces the number of trainable parameters by up to 10,000 times and GPU memory consumption by 3 times compared to full fine-tuning of GPT-3 175B. This makes it possible to fine-tune 175B parameter models using consumer-grade hardware or modest clusters, while matching or exceeding full fine-tuning performance across GLUE and WikiSQL benchmarks.'
      }
    ],
    referenceSummary: 'Hu et al. introduce LoRA (Low-Rank Adaptation), freezing pre-trained transformer weights and injecting trainable low-rank decomposition matrices (Delta W = B * A). LoRA reduces trainable parameter count by up to 10,000x and GPU VRAM requirements by 3x while matching full fine-tuning accuracy and introducing zero inference latency through direct weight folding.'
  },
  {
    id: 'paper-flashattention',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: ['Tri Dao', 'Daniel Y. Fu', 'Stefano Ermon', 'Atri Rudra', 'Christopher Ré'],
    year: 2022,
    category: 'Hardware & Acceleration',
    abstract: 'Transformers are slow and memory-hungry on long sequences, as the time and memory complexity of self-attention are quadratic in sequence length. Approximate attention methods have attempted to trade off model quality to reduce compute, but often do not achieve wall-clock speedup. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce memory reads/writes between GPU high bandwidth memory (HBM) and GPU on-chip SRAM.',
    sections: [
      {
        title: 'IO-Aware GPU Memory Hierarchy',
        content: 'Standard self-attention computes intermediate N x N attention matrix S = QK^T, writes it to slow GPU High Bandwidth Memory (HBM), reads it back to compute P = softmax(S), writes P to HBM, and finally reads P to multiply with V. For typical GPU architectures like A100, SRAM access speeds are 19 TB/s while HBM bandwidth is only 1.5 TB/s. Memory access (IO) is the primary bottleneck rather than raw FLOP compute.'
      },
      {
        title: 'Tiling & Online Softmax Algorithm',
        content: 'FlashAttention computes exact attention by loading blocks of Q, K, and V into fast on-chip SRAM, computing partial attention matrices, and incrementally updating the softmax denominator and numerator using an online softmax scaling technique. This completely eliminates writing the intermediate N x N attention matrix to HBM, reducing memory complexity from O(N^2) to O(N).'
      },
      {
        title: 'Wall-Clock Speedup & Extended Context',
        content: 'FlashAttention yields 2x to 4x wall-clock speedup on GPT-2 and BERT training over standard PyTorch attention, and up to 3x speedup on inference. By overcoming quadratic memory constraints, FlashAttention enables training Transformers with context lengths of 64k tokens, yielding dramatic improvements in document summarization and long-context reasoning.'
      }
    ],
    referenceSummary: 'Dao et al. present FlashAttention, an IO-aware exact attention algorithm that reorganizes GPU memory access through block tiling and online softmax. By avoiding intermediate N x N attention matrix read/writes to slow GPU High Bandwidth Memory (HBM) and utilizing fast on-chip SRAM, FlashAttention slashes memory complexity from quadratic to linear O(N) and achieves 2x to 4x wall-clock speedups.'
  },
  {
    id: 'paper-cot',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed Chi', 'Quoc Le', 'Denny Zhou'],
    year: 2022,
    category: 'Prompt Engineering & Reasoning',
    abstract: 'We explore how generating a chain of thought—a series of intermediate reasoning steps—significantly improves the ability of large language models to perform complex reasoning. In particular, we show that such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain-of-thought prompting, where a few chain-of-thought demonstrations are provided as exemplars in few-shot prompting.',
    sections: [
      {
        title: 'Reasoning Emergence in Large Language Models',
        content: 'Standard few-shot prompting gives input-output pairs without intermediate steps, failing on multi-step reasoning problems like math word problems and symbolic manipulation. Chain-of-thought (CoT) prompting presents exemplars with structured intermediate thought traces (e.g., "Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 balls. 5 + 6 = 11. The answer is 11.").'
      },
      {
        title: 'Mathematical & Symbolic Benchmarks',
        content: 'CoT prompting was evaluated on arithmetic reasoning benchmarks including GSM8K, SVAMP, and ASDiv, as well as commonsense and symbolic reasoning tasks. On GSM8K, chain-of-thought prompting with PaLM 540B improves solve rates from 17.9% (standard prompting) to 56.9%, outperforming even task-specific fine-tuned models.'
      },
      {
        title: 'Scaling Thresholds & Qualitative Properties',
        content: 'Experiments reveal that chain-of-thought prompting is an emergent capability: it does not yield substantial gains on models with fewer than 10 billion parameters, but delivers exponential performance improvements on models scaled beyond 100 billion parameters. Intermediate steps also provide human-interpretable reasoning trajectories that can be inspected and debugged.'
      }
    ],
    referenceSummary: 'Wei et al. demonstrate Chain-of-Thought (CoT) prompting, showing that generating intermediate reasoning steps in few-shot exemplars dramatically elevates reasoning in large language models (>100B parameters). On mathematical datasets like GSM8K, CoT elevates accuracy from 17.9% to 56.9%, providing transparent step-by-step rationales for complex deduction.'
  },
  {
    id: 'paper-dpo',
    title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
    authors: ['Rafael Rafailov', 'Archit Sharma', 'Eric Mitchell', 'Stefano Ermon', 'Christopher D. Manning', 'Chelsea Finn'],
    year: 2023,
    category: 'Model Alignment & RLHF',
    abstract: 'While reinforcement learning from human feedback (RLHF) is effective at aligning large language models with human preferences, it is complex, unstable, and computationally demanding. It involves fitting a reward model, followed by fine-tuning an actor policy via reinforcement learning (such as PPO). We show that the constrained reward optimization problem in RLHF can be solved exactly with a simple cross-entropy loss, yielding Direct Preference Optimization (DPO).',
    sections: [
      {
        title: 'Mathematical Derivation & Closed-Form Reparameterization',
        content: 'Under the standard Bradley-Terry preference model, the ground-truth reward can be mathematically expressed in closed form as a function of the optimal policy and the reference policy: r(x, y) = beta * log(pi_theta(y|x) / pi_ref(y|x)). Substituting this formulation directly into the preference likelihood eliminates the need to train a separate reward model or deploy reinforcement learning algorithms.'
      },
      {
        title: 'Algorithmic Simplicity & Stability',
        content: 'DPO optimizes policy parameters theta directly over pairs of human preferences (y_w, y_l) using a binary cross-entropy objective: L_DPO(theta) = -E[log sigma(beta * log(pi_theta(y_w|x)/pi_ref(y_w|x)) - beta * log(pi_theta(y_l|x)/pi_ref(y_l|x)))]. The algorithm requires no reward model training, no sampling from the policy during training, and no hyperparameter tuning of PPO actor-critic buffers.'
      },
      {
        title: 'Empirical Alignment Performance',
        content: 'Across sentiment control, summarization (TL;DR), and open-ended dialogue (Anthropic HH), DPO matches or outperforms standard RLHF with PPO in win rate against reference responses, while training faster and with absolute numerical stability.'
      }
    ],
    referenceSummary: 'Rafailov et al. introduce Direct Preference Optimization (DPO), proving that the RLHF objective can be solved analytically through an implicit reward reparameterization. By optimizing language models directly on human preference pairs via a binary cross-entropy loss, DPO bypasses explicit reward modeling and unstable PPO reinforcement learning while achieving superior alignment.'
  },
  {
    id: 'paper-dspy',
    title: 'DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines',
    authors: ['Omar Khattab', 'Arnav Singhvi', 'Paridhi Maheshwari', 'Zhiyuan Zhang', 'Keshav Santhanam', 'Sri Vardhamanan', 'Saaket Agrawal', 'Kartik Joshi', 'Hanna Hajishirzi', 'Christopher Potts', 'Matei Zaharia'],
    year: 2023,
    category: 'Compound AI Systems & Pipelines',
    abstract: 'The ML community is rapidly adopting techniques that compose foundation models into compound systems. However, current systems rely on brittle hand-crafted prompt strings and ad-hoc tuning. We propose DSPy, a programming framework that introduces declarative signatures, parameterized modules, and automated teleprompter optimizers to compile high-level system specifications into self-improving prompt pipelines and fine-tuned weights.',
    sections: [
      {
        title: 'Declarative Signatures & Modules',
        content: 'DSPy abstracts language model interactions away from free-form string manipulation. A Signature defines the input-output behavior declaratively (e.g., "question, context -> answer"). Modules like dspy.Predict, dspy.ChainOfThought, and dspy.MultiHop implement specific prompting strategies while maintaining parameter modularity.'
      },
      {
        title: 'Teleprompter Optimizers & Compilation',
        content: 'A DSPy compiler (Optimizer) takes a multi-stage pipeline, a training set, and a metric. It automatically discovers optimal few-shot exemplars, optimizes prompt instructions, or synthesizes fine-tuning datasets using algorithms such as BootstrapFewShot, COPRO, and MIPRO. Pipelines automatically adapt when swapping between base models.'
      },
      {
        title: 'Complex Multi-Hop Benchmarks',
        content: 'On complex multi-hop question answering (HotpotQA) and mathematical reasoning (GSM8K), compiled DSPy programs outperform expert human prompt engineers by 25-40% in accuracy, turning fragile prompt engineering into systematic, test-driven software engineering.'
      }
    ],
    referenceSummary: 'Khattab et al. present DSPy, a framework that replaces brittle prompt strings with declarative signatures, parameterized modules, and teleprompter optimizers. DSPy compiles modular compound AI pipelines into optimized prompts and weights, boosting accuracy by up to 40% over hand-written prompts across multi-hop reasoning tasks.'
  },
  {
    id: 'paper-self-rag',
    title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
    authors: ['Akari Asai', 'Zeqiu Wu', 'Yizhong Wang', 'Avirup Sil', 'Hannaneh Hajishirzi'],
    year: 2023,
    category: 'Information Retrieval & RAG',
    abstract: 'Despite their promise, standard RAG systems blindly retrieve documents regardless of whether retrieval is necessary, and often generate hallucinated content unsupported by the retrieved passages. We propose Self-RAG (Self-Reflective Retrieval-Augmented Generation), a new framework that trains an LM to dynamically retrieve on demand and critique its own generations using special reflection tokens.',
    sections: [
      {
        title: 'Reflection Tokens & On-Demand Retrieval',
        content: 'Self-RAG introduces special tokens for both retrieval control (Retrieve: [Yes], [No], [Continue]) and quality critique (IsRel: [Relevant], [Irrelevant]; IsSup: [Supported], [Partially], [No]; IsUse: [5-scale utility]). The model learns when retrieval is genuinely beneficial rather than invoking retrieval indiscriminately.'
      },
      {
        title: 'Training via Critique and Generator Distillation',
        content: 'The framework uses a two-tier training procedure: a Critic model is trained using GPT-4 feedback to evaluate retrieval necessity and factual support, followed by distilling reflection tokens and generation capabilities into an open 7B or 13B parameter generator model.'
      },
      {
        title: 'Factuality & Citation Precision',
        content: 'Extensive evaluations on PubQA, ARC-Challenge, and Biography generation show Self-RAG significantly improves answer factuality and citation precision, reducing factual errors and hallucinations by up to 35% compared to vanilla RAG and standard LLMs.'
      }
    ],
    referenceSummary: 'Asai et al. propose Self-RAG, an architecture where language models learn to retrieve on demand and critique their outputs using reflection tokens ([Retrieve], [IsRel], [IsSup], [IsUse]). Self-RAG eliminates indiscriminate retrieval, improves citation fidelity, and reduces hallucinations by up to 35% across factual generation tasks.'
  },
  {
    id: 'paper-qlora',
    title: 'QLoRA: Efficient Finetuning of Quantized LLMs',
    authors: ['Tim Dettmers', 'Artidoro Pagnoni', 'Ari Holtzman', 'Luke Zettlemoyer'],
    year: 2023,
    category: 'Parameter-Efficient Fine-Tuning',
    abstract: 'We present QLoRA, an efficient finetuning approach that reduces memory usage enough to finetune a 65B parameter model on a single 48GB GPU while preserving full 16-bit finetuning task performance. QLoRA backpropagates gradients through a frozen, 4-bit quantized pre-trained language model into Low Rank Adapters (LoRA).',
    sections: [
      {
        title: '4-bit NormalFloat (NF4) & Double Quantization',
        content: 'QLoRA introduces the NormalFloat (NF4) data type, an information-theoretically optimal quantile quantization scheme for normally distributed weights. It also introduces Double Quantization, which quantizes the quantization constants themselves, saving approximately 0.37 bits per parameter (or 3GB for a 65B model).'
      },
      {
        title: 'Paged Optimizers for Memory Spikes',
        content: 'To prevent out-of-memory (OOM) errors during memory-intensive backpropagation checkpoints, QLoRA uses CUDA Paged Optimizers, automatically swapping optimizer state memory between GPU VRAM and CPU system RAM when memory allocation reaches peak thresholds.'
      },
      {
        title: 'Guanaco Models & Benchmark Performance',
        content: 'We release the Guanaco model family fine-tuned with QLoRA on the OASST1 dataset. The 65B Guanaco model achieves 99.3% of the performance of ChatGPT on the Vicuna benchmark after just 24 hours of single-GPU training, dramatically democratizing open-source model alignment.'
      }
    ],
    referenceSummary: 'Dettmers et al. present QLoRA, combining 4-bit NormalFloat (NF4) quantization, Double Quantization, and Paged Optimizers with Low-Rank Adapters. QLoRA enables fine-tuning 65B parameter models on a single 48GB GPU without performance degradation, achieving 99.3% of ChatGPT performance on Vicuna benchmarks.'
  },
  {
    id: 'paper-constitutional',
    title: 'Constitutional AI: A Harmlessness Approach from AI Feedback',
    authors: ['Yuntao Bai', 'Saurav Kadavath', 'Sandeep Kundu', 'Amanda Askell', 'John Kernion', 'Andy Jones', 'Anna Chen', 'Anna Goldie', 'Azalia Mirhoseini', 'Cameron Perez', 'Dario Amodei', 'Jared Kaplan'],
    year: 2022,
    category: 'Model Alignment & RLHF',
    abstract: 'As language models grow more capable, ensuring they are helpful and harmless becomes critical. We propose Constitutional AI (CAI), a methodology for training harmless AI assistants using self-improvement and AI feedback (RLAIF) guided by a small set of constitutional principles, completely removing the need for human harm labels.',
    sections: [
      {
        title: 'Constitutional Principles & Self-Correction',
        content: 'The system is governed by a constitution—a list of plain-English principles derived from human rights declarations, terms of service, and safety guidelines. During the supervised phase, the model is prompted with red-team attacks, generates an initial answer, critiques its own output according to constitutional rules, and rewrites the response.'
      },
      {
        title: 'RLAIF: Reinforcement Learning from AI Feedback',
        content: 'In the second phase, preference pairs are evaluated by an automated AI feedback model guided by constitutional criteria, producing synthetic preference labels. A preference model is trained on this AI-labeled dataset, and the policy model is aligned via reinforcement learning.'
      },
      {
        title: 'Transparency and Objection Handling',
        content: 'Constitutional AI eliminates human exposure to toxic content during annotation, provides explicit explainability by citing constitutional principles when refusing harmful queries, and maintains higher helpfulness compared to human-feedback baselines.'
      }
    ],
    referenceSummary: 'Bai et al. introduce Constitutional AI (RLAIF), aligning models using a written set of natural-language principles. The model critiques and revises its own responses to adversarial prompts and learns from automated AI feedback, removing human exposure to harmful content and enabling transparent, principle-guided safety.'
  },
  {
    id: 'paper-llama2',
    title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models',
    authors: ['Hugo Touvron', 'Louis Martin', 'Kevin Stone', 'Peter Albert', 'Amjad Almahairi', 'Yasmine Babaei', 'Nikolay Bashlykov', 'Soumya Batra', 'Prajjwal Bhargava', 'Shruti Bhosale', 'Dan Bikel', 'Lukas Blecher', 'Cristian Canton Ferrer'],
    year: 2023,
    category: 'Foundation Models',
    abstract: 'We develop and release Llama 2, a collection of pretrained and fine-tuned large language models (LLMs) ranging in scale from 7 billion to 70 billion parameters. Our fine-tuned LLMs, called Llama 2-Chat, are optimized for dialogue use cases. Out of the box, they outperform open-source chat models on most benchmarks we tested and match or exceed closed commercial models in human evaluation for helpfulness and safety.',
    sections: [
      {
        title: 'Pre-Training Corpus & Architectural Upgrades',
        content: 'Llama 2 was trained on 2 trillion tokens of publicly available data, a 40% increase over Llama 1. The context length was doubled from 2,048 to 4,096 tokens. The 34B and 70B models adopt Grouped-Query Attention (GQA) to accelerate inference decoding speed and reduce KV cache memory overhead.'
      },
      {
        title: 'Iterative Fine-Tuning: SFT and Dual RLHF',
        content: 'Llama 2-Chat leverages supervised fine-tuning (SFT) followed by iterative reinforcement learning with human feedback using both Rejection Sampling and Proximal Policy Optimization (PPO). Crucially, separate reward models are trained for Helpfulness and Safety to avoid compromising conversational utility.'
      },
      {
        title: 'Ghost Attention (GAtt) for Multi-Turn Consistency',
        content: 'To prevent chat models from forgetting initial system instructions across prolonged multi-turn conversations, Llama 2 introduces Ghost Attention (GAtt), augmenting dialogue history with synthetic instruction prefixes during training to ensure multi-turn adherence.'
      }
    ],
    referenceSummary: 'Touvron et al. release Llama 2 (7B-70B parameters), trained on 2 trillion tokens with a 4k context window and Grouped-Query Attention (GQA). Llama 2-Chat employs dual reward models (Helpfulness and Safety) in iterative RLHF and Ghost Attention (GAtt) for persistent multi-turn instruction adherence.'
  },
  {
    id: 'paper-speculative',
    title: 'Fast Inference from Transformers via Speculative Decoding',
    authors: ['Yaniv Leviathan', 'Matan Kalman', 'Yossi Matias'],
    year: 2023,
    category: 'Hardware & Acceleration',
    abstract: 'Generating text with large autoregressive models is notoriously slow and memory-bandwidth bound, as each generated token requires reading all model weights from GPU memory into compute cores. We propose Speculative Decoding, an algorithmic framework that speeds up decoding by 2x to 3x without changing model weights or degrading output distribution.',
    sections: [
      {
        title: 'Draft-and-Verify Paradigm',
        content: 'Speculative decoding pairs a large target model M_target with a fast, lightweight draft model M_draft. The draft model speculatively generates a sequence of K tokens in parallel or low latency. The large target model then evaluates all K tokens in a single parallel forward pass, accepting or rejecting each speculative token based on a modified rejection sampling formula.'
      },
      {
        title: 'Exact Mathematical Equivalence',
        content: 'By calibrating the acceptance threshold according to min(1, p_target(x) / p_draft(x)), speculative decoding guarantees that the generated tokens follow the exact probability distribution of the target model. It produces identical output quality with zero degradation in perplexity or BLEU score.'
      },
      {
        title: 'Latency Speedups in Production',
        content: 'Experiments with T5-XXL and Chinchilla models demonstrate 2x to 3.5x wall-clock speedup across standard NLP tasks. Because memory bandwidth is the dominating cost in single-batch LLM inference, verifying multiple tokens simultaneously maximizes compute utilization.'
      }
    ],
    referenceSummary: 'Leviathan et al. introduce Speculative Decoding, accelerating transformer inference by 2x to 3.5x without changing output distribution. A small draft model generates candidate tokens speculatively, and the large target model verifies them in a single parallel forward pass using rejection sampling.'
  }
];

/**
 * Builds the complete pre-processed and chunked corpus.
 */
export function buildCorpus(): DocumentItem[] {
  return RAW_DOCUMENTS.map(doc => {
    const chunks = doc.sections.flatMap((section, sectionIdx) => {
      const rawChunks = chunkDocument(section.content, 140, 30);
      return rawChunks.map((c, chunkIdx) => {
        const cleaned = cleanText(c.content);
        return {
          id: `${doc.id}-s${sectionIdx}-c${chunkIdx}`,
          docId: doc.id,
          docTitle: doc.title,
          sectionTitle: section.title,
          content: c.content,
          cleanedContent: cleaned,
          tokenCount: c.tokenCount,
          embedding: computeSemanticVector(cleaned)
        };
      });
    });

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

    return {
      ...doc,
      chunks,
      totalTokens
    };
  });
}

export const INITIAL_CORPUS = buildCorpus();

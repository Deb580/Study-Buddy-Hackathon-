// Generates new questions that avoid duplicates

const questionTemplates = {
  biology: [
    {
      template: "What is the primary function of {structure} in photosynthesis?",
      structures: ["chloroplasts", "thylakoids", "stroma", "chlorophyll", "stomata", "mesophyll cells", "guard cells"],
      generateAnswer: (structure) => `Performs specific photosynthetic processes in ${structure}`
    },
    {
      template: "Which molecule is produced during {stage} of photosynthesis?",
      stages: ["light-dependent reactions", "Calvin cycle", "light-independent reactions", "carbon fixation", "photolysis"],
      generateAnswer: (stage) => `Specific products of ${stage}`
    },
    {
      template: "What happens to {molecule} in the {process}?",
      molecules: ["CO2", "H2O", "glucose", "ATP", "NADPH", "oxygen", "G3P"],
      processes: ["Calvin cycle", "light reactions", "photolysis", "carbon fixation", "electron transport"],
      generateAnswer: (molecule, process) => `Transformation of ${molecule} during ${process}`
    },
    {
      template: "Which factor most affects {aspect} of photosynthesis?",
      aspects: ["rate", "efficiency", "productivity", "yield", "growth"],
      generateAnswer: (aspect) => `Environmental factors affecting ${aspect}`
    },
    {
      template: "How do {plantType} plants differ from C3 plants in photosynthesis?",
      plantTypes: ["C4", "CAM", "C3-C4 intermediate"],
      generateAnswer: (plantType) => `Unique adaptations of ${plantType} plants`
    },
    {
      template: "What is the role of {enzyme} in photosynthesis?",
      enzymes: ["RuBisCO", "PEP carboxylase", "ATP synthase", "NADP+ reductase", "carbonic anhydrase"],
      generateAnswer: (enzyme) => `Catalytic function of ${enzyme}`
    },
    {
      template: "Which wavelength of light is most effective for {process}?",
      processes: ["chlorophyll absorption", "photosynthesis", "photolysis", "electron excitation"],
      generateAnswer: (process) => `Optimal light conditions for ${process}`
    },
    {
      template: "What happens to {product} after it is produced in photosynthesis?",
      products: ["glucose", "oxygen", "ATP", "NADPH", "G3P"],
      generateAnswer: (product) => `Fate and utilization of ${product}`
    }
  ],
  computerScience: [
    {
      template: "What is the time complexity of {operation} in a {structure}?",
      operations: ["insertion", "deletion", "search", "traversal", "sorting", "merging"],
      structures: ["array", "linked list", "hash table", "binary search tree", "balanced tree", "heap"],
      generateAnswer: (op, struct) => `Time complexity analysis for ${op} in ${struct}`
    },
    {
      template: "Which data structure is best for {useCase}?",
      useCases: ["frequent lookups", "frequent insertions", "maintaining sorted order", "priority queues", "graph representation"],
      generateAnswer: (useCase) => `Optimal data structure for ${useCase}`
    },
    {
      template: "How does {algorithm} work?",
      algorithms: ["quicksort", "mergesort", "binary search", "depth-first search", "breadth-first search", "Dijkstra's algorithm"],
      generateAnswer: (algorithm) => `Step-by-step process of ${algorithm}`
    },
    {
      template: "What is the space complexity of {algorithm}?",
      algorithms: ["recursive quicksort", "iterative binary search", "BFS", "DFS", "dynamic programming solution"],
      generateAnswer: (algorithm) => `Memory usage analysis of ${algorithm}`
    },
    {
      template: "When would you use {pattern} in algorithm design?",
      patterns: ["divide and conquer", "dynamic programming", "greedy approach", "backtracking", "two pointers"],
      generateAnswer: (pattern) => `Appropriate scenarios for ${pattern}`
    },
    {
      template: "What is the worst-case scenario for {algorithm}?",
      algorithms: ["quicksort", "hash table lookup", "binary search", "heap operations"],
      generateAnswer: (algorithm) => `Performance degradation in ${algorithm}`
    },
    {
      template: "How do you optimize {operation} in {context}?",
      operations: ["search", "insertion", "deletion", "sorting", "traversal"],
      contexts: ["large datasets", "real-time systems", "memory-constrained environments", "distributed systems"],
      generateAnswer: (op, context) => `Optimization strategies for ${op} in ${context}`
    }
  ],
  history: [
    {
      template: "What was the main cause of {event}?",
      events: ["the French Revolution", "the American Revolution", "World War I", "the fall of the Roman Empire", "the Industrial Revolution"],
      generateAnswer: (event) => `Primary factors leading to ${event}`
    },
    {
      template: "How did {person} influence {period}?",
      people: ["Napoleon Bonaparte", "Louis XVI", "Robespierre", "Marie Antoinette", "Voltaire"],
      periods: ["the French Revolution", "the Enlightenment", "the Napoleonic Era", "the Reign of Terror"],
      generateAnswer: (person, period) => `Impact of ${person} on ${period}`
    },
    {
      template: "What were the consequences of {event}?",
      events: ["the storming of the Bastille", "the execution of Louis XVI", "the Reign of Terror", "Napoleon's coup", "the Declaration of Rights"],
      generateAnswer: (event) => `Long-term effects of ${event}`
    },
    {
      template: "Which social group was most affected by {policy}?",
      policies: ["the Estates-General", "the Declaration of Rights", "the Civil Constitution", "the Law of Suspects"],
      generateAnswer: (policy) => `Social impact of ${policy}`
    },
    {
      template: "How did {country} respond to the French Revolution?",
      countries: ["Britain", "Austria", "Prussia", "Russia", "Spain"],
      generateAnswer: (country) => `${country}'s reaction to revolutionary France`
    },
    {
      template: "What role did {institution} play in the revolution?",
      institutions: ["the Catholic Church", "the National Assembly", "the Committee of Public Safety", "the Directory"],
      generateAnswer: (institution) => `Influence of ${institution} during the revolution`
    }
  ]
};

class MockDynamicQuizService {
  generateNewQuestions(originalContent, previousQuestions, count = 10) {
    // Detect topic from content
    const topic = this.detectTopic(originalContent);
    const templates = questionTemplates[topic] || questionTemplates.biology;
    
    // Filter out already-asked questions
    const previousTexts = new Set(previousQuestions.map(q => q.question.toLowerCase()));
    const newQuestions = [];
    
    let attempts = 0;
    while (newQuestions.length < count && attempts < count * 3) {
      const question = this.generateUniqueQuestion(templates, previousTexts, topic);
      if (question && !previousTexts.has(question.question.toLowerCase())) {
        newQuestions.push(question);
        previousTexts.add(question.question.toLowerCase());
      }
      attempts++;
    }
    
    // If we couldn't generate enough unique questions, fill with generic ones
    while (newQuestions.length < count) {
      newQuestions.push(this.generateGenericQuestion(topic, newQuestions.length));
    }
    
    return newQuestions;
  }

  generateUniqueQuestion(templates, usedQuestions, topic) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    try {
      let questionText = template.template;
      let answer = template.generateAnswer;
      
      // Replace placeholders with random values
      if (template.structures) {
        const structure = template.structures[Math.floor(Math.random() * template.structures.length)];
        questionText = questionText.replace('{structure}', structure);
        answer = answer(structure);
      }
      
      if (template.stages) {
        const stage = template.stages[Math.floor(Math.random() * template.stages.length)];
        questionText = questionText.replace('{stage}', stage);
        answer = answer(stage);
      }
      
      if (template.molecules && template.processes) {
        const molecule = template.molecules[Math.floor(Math.random() * template.molecules.length)];
        const process = template.processes[Math.floor(Math.random() * template.processes.length)];
        questionText = questionText.replace('{molecule}', molecule).replace('{process}', process);
        answer = answer(molecule, process);
      }
      
      if (template.aspects) {
        const aspect = template.aspects[Math.floor(Math.random() * template.aspects.length)];
        questionText = questionText.replace('{aspect}', aspect);
        answer = answer(aspect);
      }
      
      if (template.plantTypes) {
        const plantType = template.plantTypes[Math.floor(Math.random() * template.plantTypes.length)];
        questionText = questionText.replace('{plantType}', plantType);
        answer = answer(plantType);
      }
      
      if (template.enzymes) {
        const enzyme = template.enzymes[Math.floor(Math.random() * template.enzymes.length)];
        questionText = questionText.replace('{enzyme}', enzyme);
        answer = answer(enzyme);
      }
      
      if (template.processes) {
        const process = template.processes[Math.floor(Math.random() * template.processes.length)];
        questionText = questionText.replace('{process}', process);
        answer = answer(process);
      }
      
      if (template.products) {
        const product = template.products[Math.floor(Math.random() * template.products.length)];
        questionText = questionText.replace('{product}', product);
        answer = answer(product);
      }
      
      if (template.operations && template.structures) {
        const operation = template.operations[Math.floor(Math.random() * template.operations.length)];
        const structure = template.structures[Math.floor(Math.random() * template.structures.length)];
        questionText = questionText.replace('{operation}', operation).replace('{structure}', structure);
        answer = answer(operation, structure);
      }
      
      if (template.useCases) {
        const useCase = template.useCases[Math.floor(Math.random() * template.useCases.length)];
        questionText = questionText.replace('{useCase}', useCase);
        answer = answer(useCase);
      }
      
      if (template.algorithms) {
        const algorithm = template.algorithms[Math.floor(Math.random() * template.algorithms.length)];
        questionText = questionText.replace('{algorithm}', algorithm);
        answer = answer(algorithm);
      }
      
      if (template.patterns) {
        const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)];
        questionText = questionText.replace('{pattern}', pattern);
        answer = answer(pattern);
      }
      
      if (template.contexts) {
        const operation = template.operations[Math.floor(Math.random() * template.operations.length)];
        const context = template.contexts[Math.floor(Math.random() * template.contexts.length)];
        questionText = questionText.replace('{operation}', operation).replace('{context}', context);
        answer = answer(operation, context);
      }
      
      if (template.events) {
        const event = template.events[Math.floor(Math.random() * template.events.length)];
        questionText = questionText.replace('{event}', event);
        answer = answer(event);
      }
      
      if (template.people && template.periods) {
        const person = template.people[Math.floor(Math.random() * template.people.length)];
        const period = template.periods[Math.floor(Math.random() * template.periods.length)];
        questionText = questionText.replace('{person}', person).replace('{period}', period);
        answer = answer(person, period);
      }
      
      if (template.policies) {
        const policy = template.policies[Math.floor(Math.random() * template.policies.length)];
        questionText = questionText.replace('{policy}', policy);
        answer = answer(policy);
      }
      
      if (template.countries) {
        const country = template.countries[Math.floor(Math.random() * template.countries.length)];
        questionText = questionText.replace('{country}', country);
        answer = answer(country);
      }
      
      if (template.institutions) {
        const institution = template.institutions[Math.floor(Math.random() * template.institutions.length)];
        questionText = questionText.replace('{institution}', institution);
        answer = answer(institution);
      }
      
      // Generate options
      const options = this.generateOptions(answer, topic);
      
      return {
        question: questionText,
        options: options,
        correctAnswer: 0, // First option is always correct
        explanation: answer,
        difficulty: this.getRandomDifficulty(),
        topic: topic
      };
      
    } catch (error) {
      console.error('Error generating question:', error);
      return null;
    }
  }

  generateOptions(correctAnswer, topic) {
    const options = [correctAnswer];
    
    // Generate 3 incorrect options based on topic
    const incorrectAnswers = this.getIncorrectAnswers(topic);
    
    while (options.length < 4 && incorrectAnswers.length > 0) {
      const randomIndex = Math.floor(Math.random() * incorrectAnswers.length);
      const option = incorrectAnswers.splice(randomIndex, 1)[0];
      if (!options.includes(option)) {
        options.push(option);
      }
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }

  getIncorrectAnswers(topic) {
    const incorrectAnswers = {
      biology: [
        "Stores water and nutrients",
        "Provides structural support",
        "Regulates temperature",
        "Facilitates gas exchange",
        "Produces hormones",
        "Conducts electrical signals",
        "Filters waste products",
        "Maintains pH balance"
      ],
      computerScience: [
        "O(n²) time complexity",
        "O(n) space complexity", 
        "Uses recursion",
        "Requires sorting first",
        "Needs extra memory",
        "Has logarithmic growth",
        "Uses hash functions",
        "Requires preprocessing"
      ],
      history: [
        "Economic prosperity",
        "Social stability",
        "Political reform",
        "Cultural development",
        "Military expansion",
        "Religious tolerance",
        "Technological advancement",
        "Educational reform"
      ]
    };
    
    return incorrectAnswers[topic] || incorrectAnswers.biology;
  }

  generateGenericQuestion(topic, index) {
    const genericQuestions = {
      biology: [
        {
          question: `What is a key characteristic of biological ${this.getRandomBiologicalTerm()}?`,
          options: ["High metabolic rate", "Cellular organization", "Rapid reproduction", "Large size"],
          correctAnswer: 1,
          explanation: "Cellular organization is fundamental to all living organisms"
        }
      ],
      computerScience: [
        {
          question: `What is the primary advantage of using ${this.getRandomCSConcept()}?`,
          options: ["Faster execution", "Better memory usage", "Easier implementation", "More secure"],
          correctAnswer: 0,
          explanation: "This approach typically provides performance benefits"
        }
      ],
      history: [
        {
          question: `What was a significant outcome of ${this.getRandomHistoricalEvent()}?`,
          options: ["Political change", "Economic growth", "Social reform", "Cultural shift"],
          correctAnswer: 0,
          explanation: "This event had major political implications"
        }
      ]
    };
    
    const questions = genericQuestions[topic] || genericQuestions.biology;
    return questions[index % questions.length];
  }

  getRandomBiologicalTerm() {
    const terms = ["cells", "enzymes", "proteins", "DNA", "mitochondria", "chloroplasts"];
    return terms[Math.floor(Math.random() * terms.length)];
  }

  getRandomCSConcept() {
    const concepts = ["algorithms", "data structures", "hash tables", "binary trees", "sorting"];
    return concepts[Math.floor(Math.random() * concepts.length)];
  }

  getRandomHistoricalEvent() {
    const events = ["the revolution", "this period", "these changes", "the movement"];
    return events[Math.floor(Math.random() * events.length)];
  }

  getRandomDifficulty() {
    const difficulties = ["easy", "medium", "hard"];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  detectTopic(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('photosynthesis') || 
        contentLower.includes('biology') || 
        contentLower.includes('chloroplast') ||
        contentLower.includes('plant') ||
        contentLower.includes('cell')) {
      return 'biology';
    }
    
    if (contentLower.includes('algorithm') || 
        contentLower.includes('data structure') ||
        contentLower.includes('programming') ||
        contentLower.includes('computer') ||
        contentLower.includes('sorting') ||
        contentLower.includes('complexity')) {
      return 'computerScience';
    }
    
    if (contentLower.includes('revolution') || 
        contentLower.includes('history') ||
        contentLower.includes('french') ||
        contentLower.includes('war') ||
        contentLower.includes('political')) {
      return 'history';
    }
    
    return 'biology'; // default
  }
}

module.exports = new MockDynamicQuizService();

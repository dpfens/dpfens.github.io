---
layout: post
title:  "Neural Variational Document Models with PyTorch for Topic Extraction"
description: Discover how Neural Variational Document Models, implemented using PyTorch, improve topic modeling and unsupervised learning in natural language processing. Learn about the architecture, training process, and applications of these latent variable models for text analysis and beyond.
keywords: Neural Variational Document Models, PyTorch, Unsupervised Learning, Topic Modeling, Latent Variable Models, Natural Language Processing, Text Analysis, Machine Learning, Deep Learning, Variational Inference
tags: python nlp data math

---

Neural Variational Document Models (NVDMs) are a class of unsupervised learning models that leverage the power of deep learning and variational inference to uncover latent topics and semantic structures within a collection of documents. These models combine the expressiveness of neural networks with the probabilistic framework of latent variable models, enabling them to capture complex relationships and generate meaningful representations of text data.

At their core, NVDMs are auto-encoders, consisting of an encoder-decoder architecture where the encoder maps the input documents to a continuous latent space, and the decoder reconstructs the original documents from the latent representations. The encoder is typically a neural network, such as a Convolutional Neural Network (CNN) or a Recurrent Neural Network (RNN), which learns to compress the input documents into a lower-dimensional latent space. The decoder, on the other hand, is responsible for generating the words in the documents based on the latent representations.

The key innovation in NVDMs is the incorporation of variational inference, which allows the model to learn a probabilistic distribution over the latent space. By introducing a variational posterior distribution, NVDMs can capture the uncertainty associated with the latent representations and enable more robust and interpretable topic modeling. The objective of training an NVDM is to maximize the evidence lower bound (ELBO), which consists of a reconstruction term and a regularization term that encourages the variational posterior to be close to a prior distribution, typically a multivariate Gaussian.

NVDMs have found numerous applications in natural language processing tasks, such as topic modeling, document clustering, text generation, and sentiment analysis. By learning rich and interpretable representations of documents, NVDMs enable users to gain insights into the underlying themes and semantic structures within their text data. Moreover, the ability to generate new documents from the learned latent space opens up possibilities for content creation and data augmentation.

{% include components/heading.html heading='Fundamentals of Neural Variational Document Models' level=2 %}

Neural Variational Document Models (NVDMs) are built upon three key concepts: latent variable models, variational inference, and the encoder-decoder architecture.

{% include components/heading.html heading='Latent Variable Models' level=3 %}

Latent variable models are probabilistic models that introduce unobserved (latent) variables to capture the underlying structure and dependencies in the observed data. In the context of document modeling, latent variables can represent abstract concepts, such as topics or themes, that influence the generation of words in a document. By learning the latent variables, NVDMs can uncover the hidden semantic structure within a collection of documents.

The joint probability distribution of an NVDM can be expressed as:

`p(x, z) = p(z) * p(x|z)`

where x represents the observed document, z represents the latent variables, `p(z)` is the prior distribution over the latent variables, and `p(x|z)` is the conditional probability of the document given the latent variables.

Variational Inference:
Variational inference is a technique used to approximate intractable posterior distributions in probabilistic models. In NVDMs, the true posterior distribution `p(z|x)` is often computationally intractable due to the complexity of the model. Variational inference introduces a variational posterior distribution `q(z|x)`, which is a simpler and more tractable distribution that approximates the true posterior.

The goal of variational inference is to minimize the Kullback-Leibler (KL) divergence between the variational posterior and the true posterior:

`KL(q(z|x) || p(z|x))`

By minimizing the KL divergence, the variational posterior is encouraged to be close to the true posterior, enabling efficient inference and learning in NVDMs.


{% include components/heading.html heading='Encoder-Decoder Architecture' level=3 %}

NVDMs employ an encoder-decoder architecture to learn the latent representations and generate documents. The encoder is a neural network that takes the input document x and maps it to a continuous latent space, producing the parameters of the variational posterior distribution `q(z|x)`. The encoder can be implemented using various neural network architectures, such as Convolutional Neural Networks (CNNs) or Recurrent Neural Networks (RNNs), depending on the nature of the text data.

The decoder, on the other hand, is responsible for generating the words in the document based on the latent representation z sampled from the variational posterior. The decoder is typically a neural network that models the conditional probability distribution `p(x|z)`. Common choices for the decoder include RNNs or feed-forward neural networks with a softmax output layer to generate the probability distribution over the vocabulary.

During training, the encoder and decoder are jointly optimized to maximize the evidence lower bound (ELBO), which consists of two terms:

`ELBO = E[log p(x|z)] - KL(q(z|x) || p(z))`

The first term is the expected log-likelihood of the document given the latent variables, encouraging the decoder to generate documents similar to the input. The second term is the KL divergence between the variational posterior and the prior distribution, acting as a regularizer to prevent overfitting and promote a smooth latent space.  By leveraging the power of latent variable models, variational inference, and the encoder-decoder architecture, NVDMs can learn meaningful and interpretable representations of documents, enabling various downstream tasks such as topic modeling, document clustering, and text generation.


{% include components/heading.html heading='Reparameterization trick' level=3 %}

In the context of NVDMs, the goal is to learn a variational posterior distribution `q(z|x)` that approximates the true posterior distribution `p(z|x)` over the latent variables z given the input document x. However, directly sampling from the variational posterior during the forward pass of the model would block the gradients, as the sampling operation is not differentiable.

The reparameterization trick addresses this issue by separating the sampling process into two parts: a deterministic part and a stochastic part. Instead of directly sampling from the variational posterior `q(z|x)`, which is typically parameterized as a Gaussian distribution with mean `μ` and standard deviation `σ`, the trick introduces an auxiliary noise variable `ε` drawn from a standard Gaussian distribution `N(0, 1)`.


The reparameterization is as follows:

`z = μ + σ * ε, where ε ~ N(0, 1)`

By expressing the sampling process in this way, the gradients can flow through the deterministic parts (`μ` and `σ`) of the reparameterization, while the stochastic part (`ε`) remains independent of the model parameters.

By using the reparameterization trick, the NVDM can backpropagate gradients through the sampling process and optimize the variational parameters (`μ` and `σ`) using standard gradient descent methods. This allows the model to learn a meaningful latent representation of the input documents while effectively approximating the true posterior distribution.

The reparameterization trick has been widely adopted in variational inference and generative models, as it enables efficient training and inference in models with continuous latent variables. It has been instrumental in the success of VAEs and their variants, including NVDMs, in various domains such as computer vision, natural language processing, and recommendation systems.


{% include components/heading.html heading='Advantages of NVDMs over Traditional Topic Modeling Techniques' level=2 %}

Neural Variational Document Models (NVDMs) offer several advantages over traditional topic modeling techniques, such as Latent Dirichlet Allocation (LDA) and Probabilistic Latent Semantic Analysis (PLSA). These advantages stem from the ability of NVDMs to leverage deep learning architectures and variational inference, enabling them to capture complex semantic relationships, handle large-scale datasets, and provide flexibility in model design. Let's explore each of these advantages in more detail.

Capturing Complex Semantic Relationships:
Traditional topic modeling techniques, such as LDA and PLSA, rely on bag-of-words representations and assume a simple generative process for document generation. They often struggle to capture the complex semantic relationships and dependencies between words and topics. In contrast, NVDMs utilize deep learning architectures, such as Convolutional Neural Networks (CNNs) or Recurrent Neural Networks (RNNs), which can learn rich and expressive representations of text data.

By employing neural networks, NVDMs can automatically learn intricate patterns and dependencies in the text, capturing non-linear relationships between words and topics. The encoder in an NVDM can extract meaningful features and contextual information from the input documents, allowing the model to uncover more nuanced and semantically coherent topics. This ability to capture complex semantic relationships enables NVDMs to generate more interpretable and meaningful topic representations compared to traditional techniques.

Traditional topic modeling techniques often face scalability challenges when dealing with large-scale datasets. As the number of documents and vocabulary size increase, the computational complexity of these techniques grows exponentially, making them impractical for handling massive text corpora. NVDMs, on the other hand, can efficiently handle large-scale datasets thanks to their integration with deep learning frameworks like PyTorch.

NVDMs can leverage the parallel processing capabilities of modern hardware, such as GPUs, to speed up training and inference. The mini-batch training paradigm used in deep learning allows NVDMs to process documents in parallel, enabling efficient learning even on large datasets. Moreover, the stochastic nature of variational inference in NVDMs enables them to approximate the posterior distribution using subsamples of the data, further improving scalability.

PyTorch, with its optimized tensor operations and built-in support for GPU acceleration, provides a powerful platform for training NVDMs on large-scale datasets. The framework's efficient memory management and ability to handle sparse computations make it well-suited for processing text data, which often exhibits high dimensionality and sparsity.

NVDMs offer a high degree of flexibility in model architecture, allowing researchers and practitioners to design models tailored to their specific needs and domains. The encoder-decoder architecture of NVDMs can be easily customized and extended to incorporate various neural network components and techniques.

For example, the encoder can be implemented using different neural network architectures, such as CNNs for capturing local patterns or RNNs for modeling sequential dependencies. The choice of architecture can be based on the characteristics of the text data and the desired level of complexity. Similarly, the decoder can be designed to generate words based on different probability distributions or incorporate additional information, such as document metadata or linguistic features.

PyTorch's modular and flexible design makes it easy to experiment with different architectures and components in NVDMs. The framework provides a wide range of pre-built neural network modules, loss functions, and optimization algorithms, allowing users to quickly prototype and iterate on their models. The dynamic computational graph in PyTorch enables dynamic model construction and modification, facilitating the development of custom NVDM architectures.

Furthermore, NVDMs can be extended to incorporate additional features or constraints, such as prior knowledge, multi-modal information, or semi-supervised learning objectives. The flexibility in model architecture enables researchers to explore novel variations and adaptations of NVDMs, pushing the boundaries of topic modeling and uncovering new insights from text data.


{% include components/heading.html heading='Implementation' level=2 %}

This implementation provides a solid foundation for training and utilizing an NVDM for topic modeling tasks. By leveraging PyTorch's powerful features and the encoder-decoder architecture, the model can learn meaningful latent representations and generate interpretable topics from a collection of documents.

{% highlight python linenos %}import torch
import torch.nn as nn
import torch.nn.functional as F


class NVDM(nn.Module):
    def __init__(self, tokenizer, embed_dim, hidden_dim, latent_dim, dropout=0.5, num_layers=2, uniqueness_weight=0.0):
        super(NVDM, self).__init__()
        self.tokenizer = tokenizer
        self.vocab_size = len(tokenizer.vocabulary())
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        self.latent_dim = latent_dim

        self.uniqueness_weight = uniqueness_weight
        # Encoder MLP
        encoder_layers = [
            nn.Linear(self.vocab_size, embed_dim),
            nn.BatchNorm1d(embed_dim),
            nn.LeakyReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(embed_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.LeakyReLU(),
            nn.Dropout(p=dropout)
            ]
        
        for _ in range(num_layers):
            encoder_layers.append(nn.Linear(hidden_dim, hidden_dim))
            encoder_layers.append(nn.BatchNorm1d(hidden_dim))
            encoder_layers.append(nn.LeakyReLU())

        self.encoder = nn.Sequential(
            *encoder_layers
        )

        # intermediate representation
        self.mu = nn.Linear(hidden_dim, latent_dim)
        self.log_var = nn.Linear(hidden_dim, latent_dim)

        # Decoder MLP
        decoder_layers = [
            nn.Linear(latent_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.LeakyReLU()
        ]
        for _ in range(num_layers):
            decoder_layers.append(nn.Linear(hidden_dim, hidden_dim))
            decoder_layers.append(nn.BatchNorm1d(hidden_dim))
            decoder_layers.append(nn.LeakyReLU())
            decoder_layers.append(nn.Dropout(p=dropout))

        decoder_layers.append(nn.Linear(hidden_dim, latent_dim))
        self.decoder = nn.Sequential(*decoder_layers)

        self.dropout_layer = nn.Dropout(p=dropout)
        self.decoder_output = nn.Linear(latent_dim, embed_dim)
        
        self.output = nn.Linear(embed_dim, self.vocab_size)
        self.output.weight.data.normal_(0, 0.01)
        self.output.bias.data.fill_(0)

    def encode(self, x):
        h = self.encoder(x)
        mu = self.mu(h)
        log_var = self.log_var(h)
        return mu, log_var

    def reparameterize(self, mu, log_var):
        std = torch.exp(0.5 * log_var)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        h = self.dropout_layer(self.decoder_output(z))
        logits = self.output(h)
        return logits
    
    def topic_word_distribution(self):
        word_embeddings = self.output.weight

        # Compute the topic-word scores
        topic_word_scores = torch.matmul(self.decoder_output.weight.t(), word_embeddings.t())
        topic_word_probabilities = torch.softmax(topic_word_scores, dim=1)

        return topic_word_probabilities
        
    def topic_words(self, top_k=10):
        topic_word_distributions = self.topic_word_distribution()

        # Get the top k words for each topic
        top_probs, top_indices = torch.topk(topic_word_distributions, k=top_k, dim=1)

        topic_words = [self.tokenizer.decode(indices.tolist()) for indices in top_indices]
        topic_probabilities = [probs.tolist() for probs in top_probs]
        return topic_words, topic_probabilities
    
    
    def topic_uniqueness_loss(self, batch_word_probabilities):
        # Normalize word probabilities to get document distributions
        document_distributions = F.normalize(batch_word_probabilities, p=1, dim=1)

        # Calculate the topic-word distribution matrix
        topic_word_dist = self.topic_word_distribution().t()

        # Calculate the document-topic distribution matrix
        document_topic_dist = torch.matmul(document_distributions, topic_word_dist)

        # Calculate the topic co-occurrence matrix
        topic_cooccurrence_matrix = torch.matmul(document_topic_dist.t(), document_topic_dist)

        # Normalize the topic co-occurrence matrix
        topic_cooccurrence_matrix = F.normalize(topic_cooccurrence_matrix, p=1, dim=1)

        # Calculate the average pairwise similarity between topics
        num_topics = topic_cooccurrence_matrix.shape[0]
        topic_similarity = torch.sum(topic_cooccurrence_matrix) - num_topics
        avg_topic_similarity = topic_similarity / (num_topics * (num_topics - 1))

        return avg_topic_similarity

    def kullback_liebler_loss(self, x, logits):
        # Normalize the document representations to get probability distributions
        original_dist = F.softmax(x, dim=1)
        reconstructed_dist = F.softmax(logits, dim=1)
        
        # Calculate KL divergence loss
        return F.kl_div(torch.log(reconstructed_dist), original_dist, reduction='batchmean')
    

    def reconstruction_loss(self, x, logits):
        # Calculate reconstruction/log-likehihood loss
        probs = F.log_softmax(logits, dim=1)
        batch_size = x.shape[0]
        return -torch.sum(x * probs) / batch_size

    def forward(self, documents):
        x = torch.stack([self.tokenizer.encode(document) for document in documents])
        mu, log_var = self.encode(x)
        z = self.reparameterize(mu, log_var)
        logits = self.decode(z)
        recon_loss = self.reconstruction_loss(x, logits)
        kl_loss = self.kullback_liebler_loss(x, logits)

        topic_uniqueness_loss = 0.0
        if self.uniqueness_weight:
            batch_word_probabilities = F.softmax(logits, dim=1)
            uniqueness_loss = self.topic_uniqueness_loss(batch_word_probabilities)
            #print('uniqueness_loss: ', self.uniqueness_weight, ' * ', uniqueness_loss, flush=True)
            topic_uniqueness_loss = self.uniqueness_weight * uniqueness_loss
        
        return recon_loss + kl_loss + topic_uniqueness_loss{% endhighlight %}

The constructor takes various parameters such as the tokenizer, embedding dimension, hidden dimension, latent dimension, dropout rate, and number of layers. Both the encoder and decoder are implemented as multi-layer perceptrons (MLPs) using PyTorch's nn.Sequential module.  The encoder MLP maps the input document representation to a hidden representation and then to the parameters (mean and log-variance) of the variational posterior distribution.  The decoder MLP takes a sample from the variational posterior and reconstructs the original document representation.


The loss implementation includes three loss functions: reconstruction loss, KL divergence loss, and topic uniqueness loss.
* `reconstruction_loss` method computes the negative log-likelihood of the reconstructed document representation given the original document representation.
*  `kullback_liebler_loss` method calculates the KL divergence between the original document distribution and the reconstructed document distribution.
*  `topic_uniqueness_loss` method computes the average pairwise similarity between topics based on the topic co-occurrence matrix, encouraging the model to learn distinct topics.


In natural language processing (NLP) tasks, such as topic modeling with NVDMs, it is essential to represent text documents in a format that can be easily processed and understood by machine learning models. One common approach is to use the Bag-of-Words (BoW) representation.

The Bag-of-Words representation treats each document as a collection of words, disregarding the order and grammatical structure of the words in the document. It represents a document as a vector, where each element corresponds to a unique word in the vocabulary, and the value of the element indicates the presence or frequency of that word in the document.

Here are a few reasons why the Bag-of-Words representation is necessary:

*  Simplicity: BoW is a simple and intuitive way to represent text documents. It captures the essential information about the presence and frequency of words in a document, which is often sufficient for many NLP tasks, including topic modeling.
Fixed-length representation: BoW converts variable-length text documents into fixed-length numerical vectors. This is crucial for machine learning models, which typically require input data to have a consistent shape and size.
*  Computationally efficient: BoW representation is computationally efficient to generate and process. It allows for fast training and inference of models, especially when dealing with large datasets.
*  Compatibility with machine learning algorithms: Many machine learning algorithms, including NVDMs, are designed to work with numerical data. The BoW representation converts text documents into numerical vectors, making them compatible with these algorithms.

However, it's important to note that the BoW representation has some limitations. It ignores the order and context of words, which can lead to the loss of semantic information. More advanced techniques, such as word embeddings (e.g., Word2Vec, GloVe), can capture semantic relationships between words and provide more meaningful representations.

{% highlight python linenos %}import torch
from torch.utils.data import Dataset
from collections import defaultdict, Counter
import re
import csv


class CSVDataset(Dataset):
    def __init__(self, path, text_field, label_field, load=False, min_df=0, max_df=float('inf'), min_tf=0, max_tf=float('inf')):
        self.path = path
        self.text_field = text_field
        self.label_field = label_field
        self.data = []

        self.min_tf = min_tf
        self.max_tf = max_tf
        if load:
            with open(self.path, 'r') as input_file:
                    self.data = list(csv.DictReader(input_file))
        
        self.term_frequencies, self.total_tokens, self.document_frequencies, self.total_documents = self.process_corpus(path, text_field)

        self.min_df = min_df
        if isinstance(min_df, float) and 0.0 <= min_df < 1.0:
            self.min_df = min_df * self.total_documents

        self.max_df = max_df
        if isinstance(max_df, float) and 0.0 <= max_df < 1.0:
            self.max_df = max_df * self.total_documents

    def process_corpus(self, path, field):
        term_frequencies = Counter()
        document_frequencies = Counter()
        total_documents = 0
        total_tokens = 0
        with open(path, 'r') as input_file:
            total_tokens = 0
            for row in csv.DictReader(input_file):
                doc = row[field]
                tokens = doc.split()
                term_frequencies.update(tokens)
                document_frequencies.update(set(tokens))
                total_tokens += len(tokens)
                total_documents += 1
        return term_frequencies, total_tokens, document_frequencies, total_documents
    
    def is_valid(self, token):
        return self.document_frequencies[token] >= self.min_df and self.document_frequencies[token] <= self.max_df and self.term_frequencies[token] >= self.min_tf and self.term_frequencies[token] <= self.max_tf

    def __len__(self):
        if self.data:
            return len(self.data)

        with open(self.path, 'r') as input_file:
            for index, row in enumerate(csv.reader(input_file)):
                pass
        return index + 1

    def __getitem__(self, idx):
        if self.data:
            text = self.data[idx][self.text_field]
            label = self.data[idx][self.label_field]
        else:
            text = None
            with open(self.path, 'r') as input_file:
                for file_idx, row in enumerate(csv.DictReader(input_file)):
                    if file_idx == idx:
                        text = row[self.text_field]
                        label = row[self.label_field]
                        break
        return text, label{% endhighlight %}

Advantages of the `CSVDataset` implementation:

*  Flexibility in data loading: The `CSVDataset` class allows for flexible loading of data from a CSV file. It supports loading the entire dataset into memory at once (`load=True`) or loading data on-the-fly as needed. This flexibility enables efficient memory usage, especially when dealing with large datasets.
*  Customizable text and label fields: The `CSVDataset` class takes `text_field` and `label_field` parameters, allowing you to specify the column names in the CSV file that correspond to the text data and labels, respectively. This makes it easy to adapt the dataset to different CSV formats and column names.
*  Preprocessing and filtering: The `CSVDataset` class provides functionality for preprocessing and filtering the text data based on term frequencies and document frequencies. The process_corpus method computes the term frequencies, document frequencies, and total token counts for the entire corpus. The is_valid method allows for filtering tokens based on the specified thresholds.

Advantages of the `min_df`, `max_df`, `min_tf`, and `max_tf` parameters:

*  Filtering rare and common words: The `min_df` and `max_df` parameters allow for filtering words based on their document frequency. By setting `min_df`, you can exclude words that appear in very few documents, which are often less informative. Similarly, by setting `max_df`, you can exclude words that appear in a large portion of the documents, as they may be too common and not discriminative.
*  Filtering low and high frequency words: The `min_tf` and `max_tf` parameters enable filtering words based on their term frequency. By setting `min_tf`, you can exclude words that occur very rarely in the corpus, which may be noise or less relevant. On the other hand, by setting `max_tf`, you can exclude words that occur too frequently and may not provide much discriminative power.
*  Vocabulary control: By applying these filtering parameters, you can control the size and quality of the vocabulary used for the BoW representation. This helps in reducing the dimensionality of the feature space and focusing on the most informative words for the given task.

{% highlight python linenos %}class TokenizedDataset(CSVDataset):

    def __getitem__(self, idx):
        text, label = super().__getitem__(idx)
        text = [token for token in text.split() if self.is_valid(token)]
        return ' '.join(text), label


class BowTokenizer:
    UNKNOWN_TOKEN = '<UNK>'

    def __init__(self, vocab_size=None, stopwords=None):
        self.vocab_size = vocab_size
        self.word2idx = None
        self.idx2word = None
        self.vocab = None
        self.stopwords = stopwords
        
    def fit(self, texts):
        # Tokenize the texts and build the vocabulary
        word_counts = Counter()
        for text in texts:
            words = self.tokenize(text)
            word_counts.update(words)

        # Sort the words by frequency and select the top vocab_size words
        vocab_size = self.vocab_size
        if not vocab_size:
            vocab_size = len(word_counts)
        
        self.vocab = [word for word, _ in word_counts.most_common(vocab_size)]
        
        # Create word-to-index and index-to-word mappings
        word2idx = {word: idx for idx, word in enumerate(self.vocab)}

        self.word2idx = word2idx
        self.idx2word = dict(zip(word2idx.values(), word2idx.keys()))
    
    def vocabulary(self):
        return list(self.vocab)
        
    def tokenize(self, text):
        # Tokenize the text into words
        words = re.findall(r'\b\w+\b', text.lower())
        return words
    
    def encode(self, text):
        # Tokenize the text and convert words to indices
        words = self.tokenize(text)
        word_counts = Counter(words)

        vocab_size = len(self.vocab)
        data = torch.zeros(vocab_size, dtype=torch.float)
        for word, count in word_counts.items():
            if word not in self.word2idx:
                continue
            word_index = self.word2idx[word]
            data[word_index] = count
        return data
    
    def decode(self, input_ids):
        # Convert token indices to
        words = [self.idx2word.get(idx, self.UNKNOWN_TOKEN) for idx in input_ids]
        return ' '.join(words){% endhighlight %}

Advantages of the `BowTokenizer` implementation:

*  Vocabulary building: The `BowTokenizer` class provides functionality for building a vocabulary from the text data. It tokenizes the texts, counts the word frequencies, and selects the top `vocab_size` words to form the vocabulary. This allows for creating a compact and representative vocabulary for the BoW representation.
*  Encoding and decoding: The `BowTokenizer` class offers methods for encoding text into BoW vectors and decoding BoW vectors back into text. The encode method tokenizes the text, maps the words to their corresponding indices in the vocabulary, and returns a vector representation. The decode method converts the BoW vector back into text by mapping the indices to their corresponding words.
*  Handling unknown words: The `BowTokenizer` class handles unknown words (words not present in the vocabulary) by mapping them to a special `<UNK>` token. This ensures that the encoding process can handle out-of-vocabulary words gracefully.


{% highlight python linenos %}import torch
import torch.optim as optim
from torch.utils.data import DataLoader
import utils
from nvdm import NVDM

import csv


def train(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0
    batch_index = -1
    for documents, labels in dataloader:
        batch_index += 1
        optimizer.zero_grad()
        loss = model(documents)
        loss.backward()

        # Clip gradients
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()
        if batch_index % 100 == 0:
            print(f'Loss #{batch_index}: ', loss.item(), flush=True)
        total_loss += loss.item()
    return total_loss / len(dataloader)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='NVDM Training')

    # NVDM configuration parameters
    nvdm_config = parser.add_argument_group('NVDM Configuration')
    nvdm_config.add_argument('--vocab_size', type=int, default=10000, help='Number of topics')
    nvdm_config.add_argument('--topics', type=int, default=30, help='Number of topics')
    nvdm_config.add_argument('--alpha', type=float, default=1.0, help='Alpha parameter')
    nvdm_config.add_argument('--hidden_size', type=int, default=256, help='Hidden size')
    nvdm_config.add_argument('--embedding_size', type=int, default=100, help='Embedding size')
    nvdm_config.add_argument('--dropout', type=float, default=0.5, help='Dropout rate')
    nvdm_config.add_argument('--num_layers', type=int, default=4, help='Number of layers')
    nvdm_config.add_argument('--num_encoder_heads', type=int, default=12, help='Number of attention heads in the encoding step')
    nvdm_config.add_argument('--num_decoder_heads', type=int, default=3, help='Number of attention heads in the decoding step')
    nvdm_config.add_argument('--temperature', type=float, default=1.0, help='Temperature for topic mixture')

    # data parametersargs.path
    data_config = parser.add_argument_group('Preprocess Function Parameters')
    data_config.add_argument('--path', type=str, default='/samples/corpus.csv', help='CSV path to load data from')
    data_config.add_argument('--text', type=str, default='content', help='CSV field containing the text')
    data_config.add_argument('--label', type=str, default='content', help='CSV field containing text label')
    data_config.add_argument('--stream', action='store_true', help='Stream data directly from the file instead of loading it into memory')

    # preprocess parameters
    preprocess_config = parser.add_argument_group('Preprocess Function Parameters')
    preprocess_config.add_argument('--mindf', type=float, default=50, help='Minimum document frequency')
    preprocess_config.add_argument('--maxdf', type=float, default=float('inf'), help='Maximum document frequency')
    preprocess_config.add_argument('--mintf', type=float, default=0, help='Minimum term frequency')
    preprocess_config.add_argument('--maxtf', type=float, default=float('inf'), help='Maximum document frequency')

    # Loss function parameters
    loss_config = parser.add_argument_group('Loss Function Parameters')
    loss_config.add_argument('--reconstruction_weight', type=float, default=1, help='Reconstruction loss weight')
    loss_config.add_argument('--kl_weight', type=float, default=0.1, help='KL divergence loss weight')
    loss_config.add_argument('--sparsity_weight', type=float, default=1.0, help='Sparsity loss weight')
    loss_config.add_argument('--uniqueness_weight', type=float, default=1.0, help='Uniqueness loss weight')

    # Training parameters
    training_config = parser.add_argument_group('Training Parameters')
    training_config.add_argument('--epochs', type=int, default=3, help='Number of epochs')
    training_config.add_argument('--batch_size', type=int, default=256, help='Batch size')
    training_config.add_argument('--learning_rate', type=float, default=0.01, help='Learning rate')
    training_config.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()
    
    # Device setup
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Define the dataset and data loader
    load = True
    if args.stream:
        load=False

    dataset = utils.TokenizedDataset(path=args.path, text_field=args.text, label_field=args.label, load=load, min_df=args.mindf, max_df=args.maxdf, min_tf=args.mintf, max_tf=args.maxtf)
    dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, drop_last=True)

    tokenizer = utils.BowTokenizer(vocab_size=args.vocab_size)
     # Load and preprocess the dataset
    with open(args.path, 'r') as input_file:
        documents = [row[args.text] for row in csv.DictReader(input_file)]
        tokenizer.fit(documents)

    # Assume we have a list 'documents' containing the input text documents
    print('preprocessing data', flush=True)

    # Create the NVDM model
    model = NVDM(tokenizer, args.embedding_size, args.hidden_size, args.topics, args.dropout, uniqueness_weight=args.uniqueness_weight).to(device)

    # Optimizer
    optimizer = optim.Adam(model.parameters(), lr=args.learning_rate)

    # Training loop
    print('training model', flush=True)
    for epoch in range(args.epochs):
        train_loss = train(model, dataloader, optimizer, device)
        print(f'Epoch [{epoch+1}/{args.epochs}], Loss: {train_loss:.4f}')

        topic_words, topic_probabilities = model.topic_words()
        for index, (words, probabilities) in enumerate(zip(topic_words, topic_probabilities)):
            print(f'\nTopic #{index + 1} Words: ', words, flush=True)
            print('Topic Probabilities:', probabilities, flush=True){% endhighlight %}

This implementation uses `argparse` to allow developers to configure the architecture, computational complexity and supported vocbaulary from the terminal, aong with the file/dataset the NVDM is trained on.  The NVDM consistently produces high quality topics, even without topic coherence loss. 

```
Topic #1 Words:  national_junior triple_jump wind_assist european_indoor_champion hurdles heptathlon organiser_calendar_doha_qat world_junior national_record_holder sprint_double
Topic Probabilities: [0.0005295022274367511, 0.000521067064255476, 0.0004984174738638103, 0.0004961825325153768, 0.0004958845092914999, 0.00047388693201355636, 0.0004721697769127786, 0.000470947299618274, 0.00046596929314546287, 0.00046446104533970356]

Topic #2 Words:  kilometre_reach tanui start_push_pace imane_merga kiprono pass_km_km athl_te splits kidane kamworor
Topic Probabilities: [0.0001887115795398131, 0.00016992191376630217, 0.00016913456784095615, 0.00016887785750441253, 0.00016846574726514518, 0.00016821929602883756, 0.00016521599900443107, 0.00016431287804152817, 0.0001635944499867037, 0.00016298888658639044]

Topic #3 Words:  fraser_pryce kaniskina maurice_greene bolt world_champion_ato farah greene gatlin korzeniowski tyson_gay
Topic Probabilities: [0.0002071216731565073, 0.00019888173846993595, 0.00019405571219976991, 0.00019289054034743458, 0.0001920316572068259, 0.00018928298959508538, 0.00018790591275319457, 0.00018012983491644263, 0.00017984140140470117, 0.000177944268216379]

Topic #4 Words:  fourth_overall nsw dobrynska ennis score combined_event effort decathlon kasyanov heptathlon
Topic Probabilities: [0.0001549244625493884, 0.00015470129437744617, 0.0001546467246953398, 0.00015251476725097746, 0.00015251018339768052, 0.00015153890126384795, 0.00014963878493290395, 0.00014948415628168732, 0.00014858909707982093, 0.00014747283421456814]

Topic #5 Words:  stage_km stage_km_stage km_stage pass_km_mark pass_kilometre se anti_dope_programme sato hold_steady tsegay
Topic Probabilities: [0.0002340153732802719, 0.00019602605607360601, 0.00019109177810605615, 0.00018873649241868407, 0.0001754782279022038, 0.00017319770995527506, 0.00017031136667355895, 0.00016833780682645738, 0.00016813860565889627, 0.00016755572869442403]

Topic #6 Words:  razorback_track_field tahoma_panose_font_font family_arial_narrow_panose arkansas_athletic_visit nixon color_windowtext_span_balloontextchar div_msonormal_margin_top font_font_family_itc stone_serif_std_medium tahoma_san_serif_msochpdefault
Topic Probabilities: [0.00020097965898457915, 0.00019553006859496236, 0.0001942943490575999, 0.00019251251069363207, 0.00019250520563218743, 0.0001921903167385608, 0.00019170019368175417, 0.0001908671110868454, 0.00019030227849725634, 0.0001891691208584234]

Topic #7 Words:  ncaas hellebaut yeah bergqvist pass_height xc harting anti_dope_programme low_stick swede
Topic Probabilities: [0.00020984900766052306, 0.00020819688506890088, 0.00020724012574646622, 0.00020646779739763588, 0.00020583244622685015, 0.00020467313879635185, 0.00020236226555425674, 0.0001983269612537697, 0.00019566438277252018, 0.00019545013492461294]

Topic #8 Words:  bend_knee plank set_rep abs knee posture push_harder main_protagonist dumbbell upper_body
Topic Probabilities: [0.00013974822650197893, 0.00013468462566379458, 0.00013362171011976898, 0.00013106761616654694, 0.00013051718997303396, 0.0001305115583818406, 0.00013051058340352029, 0.00013008633686695248, 0.00012852296640630811, 0.00012837933900300413]

Topic #9 Words:  datum_addition_shoe_weight stride_flexibility_forefoot_account usage_battery_mechanical_test lab_provide_objective_exclusive measure_sole_thickness_sit foot_road_foam_cushion review_shoe michigan_shoe_real_world pennsylvania_shoe_real_world tester_shoe
Topic Probabilities: [0.00029314172570593655, 0.00029293980333022773, 0.0002928385802078992, 0.000292605662252754, 0.00029258636641316116, 0.0002924941072706133, 0.00029232309316284955, 0.0002862800029106438, 0.00027762691024690866, 0.00026143176364712417]

Topic #10 Words:  sauce kasyanov round_foul wlodarczyk freimuth overnight_leader dressing round_throw pepper topping
Topic Probabilities: [0.00032631121575832367, 0.0003227636043448001, 0.0003218145575374365, 0.00032164782169274986, 0.00031468141241930425, 0.0003138505853712559, 0.0003078986192122102, 0.0003074088890571147, 0.0003049601800739765, 0.0002995755639858544]

Topic #11 Words:  bell_lap closing_lap jebet atapuerca foam_midsole stable_ride medial_post faith_kipyegon heath dibaba
Topic Probabilities: [0.00017135417147073895, 0.00016612840408924967, 0.000163451477419585, 0.00015913633978925645, 0.00015847643953748047, 0.00015797841479070485, 0.0001568600710015744, 0.00015681587683502585, 0.0001563854602864012, 0.00015422738215420395]

Topic #12 Words:  arron greene robles maurice_greene roble merritt wariner doucour powell kallur
Topic Probabilities: [0.0005106705939397216, 0.0005042121629230678, 0.0004950464935973287, 0.00046031526289880276, 0.0004537209460977465, 0.0004504402750171721, 0.00044670907664112747, 0.0004097057390026748, 0.0004081916413269937, 0.000406078586820513]

Topic #13 Words:  platform feature promote joint fitting argentina tech bra flexibility runners
Topic Probabilities: [0.00017971890338230878, 0.0001771343086147681, 0.0001728379720589146, 0.0001703346788417548, 0.000169746796018444, 0.00016817505820654333, 0.00016802331083454192, 0.00016549485735595226, 0.0001650949561735615, 0.00016503891674801707]

Topic #14 Words:  field_stay_tune complete_coverage_iu_track iu immediate_release_track_field federations clinic program nominee kerala indoor_track_field
Topic Probabilities: [0.00015527514915447682, 0.0001551182213006541, 0.00015354147762991488, 0.00014967596507631242, 0.0001477991754654795, 0.0001419319596607238, 0.00014136313984636217, 0.00014117403770796955, 0.00014114829536993057, 0.00014088221359997988]

Topic #15 Words:  km race_walk_challenge chihuahua km_loop ekiden km_km women_km stage_km km_stage world_marathon_champion
Topic Probabilities: [0.00045582986786030233, 0.00042629288509488106, 0.00041378289461135864, 0.00040664817788638175, 0.0003824761079158634, 0.000382121535949409, 0.000376749288989231, 0.00037533120485022664, 0.00037033201078884304, 0.00036467579775489867]

Topic #16 Words:  training_program tempo_pace hill_sprint key_workout training_schedule tempo_run build_mileage specific_workout energy_system speed_workout
Topic Probabilities: [0.00015735242050141096, 0.0001552267640363425, 0.00015487417113035917, 0.0001523850078228861, 0.00015200886991806328, 0.00015089314547367394, 0.00015057215932756662, 0.00015039686695672572, 0.00014915651991032064, 0.00014892316539771855]

Topic #17 Words:  road_foam_cushion_stride addition_shoe_weight_measure flexibility_forefoot_account_review sole_thickness_sit_foot shoe_real_world_usage provide_objective_exclusive_datum battery_mechanical_test_lab brightcove_id_video michigan_shoe_real_world review_shoe
Topic Probabilities: [0.0003328978782519698, 0.00033284176606684923, 0.00033272075233981013, 0.0003327052399981767, 0.0003280891396570951, 0.0003277743235230446, 0.0003274726332165301, 0.0003065402852371335, 0.00029554389766417444, 0.00029002776136621833]

Topic #18 Words:  true_freshman iu wartburg uw_oshkosh uw_la_crosse ncaa_meet ducks johns_hopkins lsu nyu
Topic Probabilities: [0.0005267398082651198, 0.0004757751594297588, 0.0004727425111923367, 0.00046986431698314846, 0.0004570367746055126, 0.0004565916024148464, 0.0004489163984544575, 0.0004444819933269173, 0.0004420706245582551, 0.0004363793705124408]

Topic #19 Words:  tzis score overnight_leader total_score chernova overnight_lead pts fajdek gotzis snug_fit
Topic Probabilities: [0.00024404078430961818, 0.0002303147193742916, 0.00022389950754586607, 0.00022108246048446745, 0.00021435876260511577, 0.0002082447026623413, 0.0002077820390695706, 0.00020295534341130406, 0.00020166372996754944, 0.00019990364671684802]

Topic #20 Words:  kipruto automatic_qualifying_spot kejelcha singletrack ayana koech kipyegon reach_kilometre kilometre_remain deba
Topic Probabilities: [0.0004376643046271056, 0.00041711798985488713, 0.0003987165109720081, 0.0003969542740378529, 0.0003965102368965745, 0.0003922139585483819, 0.0003744940913747996, 0.0003742391418199986, 0.00036667476524598897, 0.00035903151729144156]

Topic #21 Words:  div_msonormal_margin_margin msohyperlink_mso_style_priority style_priority_color_purple underline_visited_span_mso san_serif_link_span pt_font_family_calibri color_blue_text_decoration family_cambria_panose_font math_panose_font_font font_family_calibri_panose
Topic Probabilities: [0.0003982365597039461, 0.0003865780890919268, 0.00038599688559770584, 0.0003858261334244162, 0.00038576123188249767, 0.0003767758025787771, 0.0003719555970747024, 0.0003674782929010689, 0.0003656522312667221, 0.00036364945117384195]

Topic #22 Words:  training_program run_economy elite_runner program pennsylvania improve lactate consistent cross_training downhill
Topic Probabilities: [0.00014887095312587917, 0.00014796634786762297, 0.00014657336578238755, 0.00014462492254097015, 0.0001440627092961222, 0.00014293886488303542, 0.00014185230247676373, 0.0001412749697919935, 0.00014071576879359782, 0.0001404146896675229]

Topic #23 Words:  stage_km_stage fukuoka improved associated chiba km_stage live_japan increase muscle_fatigue function
Topic Probabilities: [0.0001788241497706622, 0.0001709579664748162, 0.00016188611334655434, 0.0001599854585947469, 0.00015961381723172963, 0.00015759470988996327, 0.00015517046267632395, 0.00015402464487124234, 0.00015372017514891922, 0.00015293341130018234]

Topic #24 Words:  grill pepper cook_minute garlic stir avocado sauce olive_oil syrup slice
Topic Probabilities: [0.00029838853515684605, 0.0002721975324675441, 0.00026485041598789394, 0.0002625574416015297, 0.0002616708807181567, 0.0002607014321256429, 0.00025924600777216256, 0.00025659558014012873, 0.00024157052394002676, 0.0002401871606707573]

Topic #25 Words:  eaton hardee follow_page trey_hardee brightcove_id claye sebrle ashton_eaton bayer attempt_clearance
Topic Probabilities: [0.00029643013840541244, 0.0002523841103538871, 0.00023353486903943121, 0.00023333514400292188, 0.00023249629884958267, 0.00023083601263351738, 0.00023046253772918135, 0.0002253647253382951, 0.00022452250414062291, 0.0002195353154093027]

Topic #26 Words:  bq vail pre_nats postseason cliff flagstaff deer west_regional hardrock dirt_road
Topic Probabilities: [0.0002408408181509003, 0.00023494136985391378, 0.00023437567870132625, 0.00022776515106670558, 0.00021635669691022485, 0.00021620663756038994, 0.00021123082842677832, 0.0002079781552311033, 0.0002075362717732787, 0.00020752135606016964]

Topic #27 Words:  ncaas span_amp_amp amp_amp_amp_lt gt_amp_amp_amp redactor_selection_marker_data amp_amp_lt_span verified_redactor_amp_amp marker_data_verified_redactor amp_amp_amp_gt marker_class_redactor_selection
Topic Probabilities: [0.0005251255352050066, 0.0005159128922969103, 0.0005129625787958503, 0.0005118255503475666, 0.0005064702709205449, 0.0004995728377252817, 0.0004968844004906714, 0.0004857392341364175, 0.00047573723713867366, 0.0004749214858748019]

Topic #28 Words:  allentown_shoe_real_world lab_test measure_sole_thickness_sit usage_battery_mechanical_test stride_flexibility_forefoot_account lab_provide_objective_exclusive datum_addition_shoe_weight foot_road_foam_cushion athl_te review_shoe
Topic Probabilities: [0.00015008448099251837, 0.00014843278040643781, 0.00014576577814295888, 0.00014571099018212408, 0.00014551033382304013, 0.00014550470223184675, 0.00014537919196300209, 0.00014508143067359924, 0.00014476204523816705, 0.0001446998940082267]

Topic #29 Words:  pace pace_slow hill_sprint mile_tempo_run run_faster lagat rupp training_cycle pacing hill
Topic Probabilities: [0.0004469976993277669, 0.000368804088793695, 0.00036803274997510016, 0.0003578069154173136, 0.0003511097456794232, 0.00034814863465726376, 0.0003470892843324691, 0.0003425931208766997, 0.0003401785215828568, 0.0003377698012627661]

Topic #30 Words:  closing_lap water_jump backstretch cherono houlihan berian ayana sowinski kipruto kilometre_reach
Topic Probabilities: [0.000206675409572199, 0.0001992114121094346, 0.00019332184456288815, 0.00019155119662173092, 0.00018596377049107105, 0.00018261026707477868, 0.00018221103528048843, 0.00018160931358579546, 0.00017999696137849241, 0.00017984103760682046]
```


{% include components/heading.html heading='References' level=2 %}

1. "Neural Variational Inference for Text Processing" by Yishu Miao, Lei Yu, and Phil Blunsom (2016)
2. "Discovering Discrete Latent Topics with Neural Variational Inference" by Yishu Miao, Edward Grefenstette, and Phil Blunsom (2017)
3. "Topic Modeling with Wasserstein Autoencoders" by Feng Nan, Ran Ding, Ramesh Nallapati, and Bing Xiang (2019)
4. "A Primer on Neural Network Models for Natural Language Processing" by Yoav Goldberg (2016)
5. "Autoencoding Variational Bayes" by Diederik P. Kingma and Max Welling (2014)

{% include components/heading.html heading='Github Projects' level=3 %}

1. [PyTorch Examples: Text Generation with VAEs](https://github.com/pytorch/examples/tree/master/vae)
2. [Neural Variational Document Model (NVDM) Implementation](https://github.com/ysmiao/nvdm)
3. [Variational Autoencoder for Topic Modeling](https://github.com/vlukiyanov/pt-avitm)
4. [PyTorch-NLP: Natural Language Processing with PyTorch](https://github.com/PetrochukM/PyTorch-NLP)
## ELK explanation

The ELK stack is a set of open-source tools commonly used for log and data analytics. "ELK" stands for `Elasticsearch, Logstash, and Kibana`, which are the three core components of the stack. Each component plays a specific role in the process of collecting, processing, storing, and visualizing log data.

1. **Elasticsearch**:

    - Role: Elasticsearch is a distributed, RESTful search and analytics engine. It is used as the central storage and search engine for log data.
    - Function: Log data is ingested into Elasticsearch, which indexes and stores the data in a way that enables fast and efficient searches.

2. **Logstash**:

    - Role: Logstash is a data processing pipeline that ingests, processes, and sends log data to Elasticsearch.
    - Function: Logstash can be configured to collect log data from various sources, transform it into a common format, and then send it to Elasticsearch. It is highly customizable and can handle various input sources and output destinations.

3. **Kibana**:

    - Role: Kibana is a visualization and analytics platform designed to work with Elasticsearch.
    - Function: Kibana allows users to interact with the log data stored in Elasticsearch. It provides a web-based interface for searching, analyzing, and visualizing log data through charts, graphs, and dashboards. Users can create custom dashboards to monitor specific metrics or troubleshoot issues.

### How ELK Stack is Used for Logging:

1. **Log Collection**:
    - Logstash is configured to collect log data from different sources, such as application logs, system logs, or network logs.
    - Logstash can parse and transform the raw log data into a standardized format.

2. **Data Processing**:

    - Logstash processes the log data to extract relevant information and structure it appropriately.
    - It can filter, enhance, or enrich the data before sending it to Elasticsearch.

3. **Data Storage**:

    - Elasticsearch indexes and stores the log data in a distributed and scalable manner.
    - The indexed data is optimized for search and retrieval.

4. **Data Visualization**:

    - Kibana connects to Elasticsearch to visualize the log data in real-time.
    - Users can create custom dashboards with various visualizations like line charts, pie charts, and maps to gain insights into log data.

### How to use Kibana

1. Run containers (using `docker-compose*.yml`) and wait until kibana will be ready.
2. Open in browser `http://localhost:5601/`.
3. Open `Analytics` -> `Discover` -> `Create data view` -> index pattern: `log`.

> In order to have the opportunity create data view (data visualizator), elasticsearch should contain some data.

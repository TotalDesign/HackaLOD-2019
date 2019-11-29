import React from 'react';
import axios from 'axios';
import { http, repository, query } from 'graphdb/lib';
import _ from 'underscore';
import './App.css';

// axios.post(`${process.env.REACT_APP_GDB_BASE_URL}/rest/login/${process.env.REACT_APP_GDB_USERNAME}`, null, {
//   headers: {
//     'X-GraphDB-Password': process.env.REACT_APP_GDB_PASSWORD
//   }
// }).then(function(response) {
//   const headers = {
//     'Authorization': response.headers.authorization,
//   };
//
//   getContent(headers);
// });

axios.get('./getAllMatches.rdf').then(response => {
  sendQuery(response.data).then(data => {
    console.log(data);
  });
});

function sendQuery(sparqlQuery, headers = {}) {
  const { RDFMimeType } = http;
  const { RDFRepositoryClient, RepositoryClientConfig } = repository;
  const { GetQueryPayload, QueryType } = query;

  const readTimeout = 30000;
  const writeTimeout = 30000;
  const config = new RepositoryClientConfig([`${process.env.REACT_APP_GDB_BASE_URL}/repositories/test_repo`],
    Object.assign(headers, {
      'Accept': RDFMimeType.SPARQL_RESULTS_JSON,
    }), '', readTimeout, writeTimeout);
  const repositoryClient = new RDFRepositoryClient(config);

  const payload = new GetQueryPayload()
    .setQuery(sparqlQuery)
    .setQueryType(QueryType.SELECT)
    .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
    .setLimit(5000);

  return repositoryClient.query(payload).then(resultSet => {
    const results = [];
    resultSet.results.bindings.forEach(item => {
      let result = _.findWhere(results, { id: item.anpRef.value });

      if (!result) {
        result = {
          id: item.anpRef.value,
          description: item.description.value,
          images: [],
        };

        results.push(result);
      }

      const images = item.fileID.value.split('|');
      const image = {
        ref: item.photoRef.value,
        large: null,
        small: null,
      };
      result.images.push(image);

      for (let i = 0; i < images.length; i++) {
        switch (i) {
          case 0:
            image.small = `http://afbeeldingen.gahetna.nl/naa/download/${images[i]}`;
            break;

          case 1:
            image.large = `http://afbeeldingen.gahetna.nl/naa/download/${images[i]}`;
            break;

          default:
            break;
        }
      }
    });

    return results;
  });
}

function App() {
  return (
    <div className="App">

    </div>
  );
}

export default App;

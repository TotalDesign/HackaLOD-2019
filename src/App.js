import React from 'react';
import SwipeableViews from 'react-swipeable-views';
import { virtualize, bindKeyboard } from 'react-swipeable-views-utils';
import axios from 'axios';
import { http, repository, query } from 'graphdb/lib';
import moment from 'moment';
import 'moment/locale/nl';
import _ from 'underscore';
import './App.css';
import Detail from './component/Detail';

moment.locale('nl');

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

const VirtualizeSwipeableViews = bindKeyboard(virtualize(SwipeableViews));

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
          date: new Date(item.date.value),
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

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: 0,
      results: [],
    };
  }

  componentDidMount() {
    axios.get('./getAllMatches.rdf').then(response => {
      sendQuery(response.data).then(results => {
        this.setState({ results });
      });
    });
  }

  handleChangeIndex = index => {
    this.setState({
      index,
    });
  };

  slideRenderer = (params) => {
    const { index, key } = params;

    const item = this.state.results[index];

    return (
      <Detail key={key} {...item} />
    );
  };

  render() {
    if (this.state.results.length > 0) {
      return (
        <div className="App">
          <VirtualizeSwipeableViews
            index={this.state.index}
            enableMouseEvents
            onChangeIndex={this.handleChangeIndex}
            slideRenderer={this.slideRenderer}
          />
        </div>
      );
    }
    else {
      return (
        <div className="App"></div>
      );
    }
  }
}

export default App;

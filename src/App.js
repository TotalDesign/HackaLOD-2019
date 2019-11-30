import React from 'react';
import {Menu, MenuItem} from '@material-ui/core';
import SwipeableViews from 'react-swipeable-views';
import { virtualize, bindKeyboard } from 'react-swipeable-views-utils';
import axios from 'axios';
import { http, repository, query } from 'graphdb/lib';
import moment from 'moment';
import 'moment/locale/nl';
import _ from 'underscore';
import './App.css';
import Detail from './component/Detail';
import Home from './component/Home';
import MenuAppBar from './component/MenuAppBar';
import Timeline from "./component/Timeline";

moment.locale('nl');

export const HOME = 'HOME';
export const DETAIL = 'DETAIL';
const TIMELINE_STATUS_RENDERED = 'TIMELINE_STATUS_RENDERED';

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
            image.small = `https://download-images.memorix.nl/naa/download/${images[i]}`;
            break;

          case 1:
            image.large = `https://download-images.memorix.nl/naa/download/${images[i]}`;
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
      anchorEl: null,
      index: 0,
      isMenuOpen: false,
      results: [],
      display: HOME,
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

  handleViewChange = display => {
    this.setState({display});
  };

  slideRenderer = (params) => {
    const { index, key } = params;

    const item = this.state.results[index];

    return (
      <Detail key={key} {...item} />
    );
  };

  getRandomItems(amount) {
    const items = [];
    const years = [];

    do {
      const index = Math.floor(Math.random() * this.state.results.length);
      const selected = this.state.results[index];

      selected.index = index;

      const year = moment(selected.date).format('YYYY');

      if (-1 === years.indexOf(year)) {
        items.push(selected);
        years.push(year);
      }
    } while (items.length < amount);

    items.sort(function(a, b) {
      if (a.date < b.date) {
        return -1;
      }

      if (a.date > b.date) {
        return 1;
      }

      return 0;
    });

    return items;
  }

  homeClickHandler = index => {
    this.setState({display: DETAIL, index});
  };

  render() {
    const {display, index, results} = this.state;

    if (results.length > 0) {
      switch(display) {
        case HOME:
          return (
            <div className="App">
              <MenuAppBar onMenuClick={this.handleViewChange}/>
              <Home items={this.getRandomItems(10)} onClick={this.homeClickHandler}/>
            </div>
          );
          break;

        case DETAIL:
          return (
            <div className="App">
              <MenuAppBar onMenuClick={this.handleViewChange}/>
              <Timeline items={this.state.results} index={this.state.index} onChangeIndex={this.handleChangeIndex}/>
              <VirtualizeSwipeableViews
                index={index}
                enableMouseEvents
                onChangeIndex={this.handleChangeIndex}
                slideRenderer={this.slideRenderer}
              />
            </div>
          );
          break;
      }
    }
    else {
      return (
        <div className="App"></div>
      );
    }
  }
}

export default App;

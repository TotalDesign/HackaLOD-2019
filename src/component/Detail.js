import React from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { http, repository, query } from 'graphdb/lib';
import {Box, CardContent, Collapse, Container, Fab, IconButton} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import Typography from '@material-ui/core/Typography';
import _ from 'underscore';
import Slider from './Slider';
import speechUtteranceChunker from '../lib/chunker';
import axios from "axios";

const synth = window.speechSynthesis;

const styles = ({spacing, transitions}) => ({
  speak: {
    marginBottom: spacing(2),
    marginTop: spacing(2),
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: transitions.create('transform', {
      duration: transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
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
    .setLimit(100);

  return repositoryClient.query(payload).then(resultSet => {
    const creators = [];
    const labels = [];
    const rights = [];

    resultSet.results.bindings.forEach(item => {
      if (-1 === creators.indexOf(item.creatorURI.value)) {
        creators.push(item.creatorURI.value);
      }

      if (-1 === labels.indexOf(item.photoLabel.value)) {
        labels.push(item.photoLabel.value);
      }

      if (-1 === rights.indexOf(item.rightsStatementURI.value)) {
        rights.push(item.rightsStatementURI.value);
      }
    });

    return { creators, labels, rights };
  });
}

class Detail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      speaking: false,
      currentImageIndex: null,
      imageMeta: null,
    };
  }

  componentDidMount(): void {
    if (null === this.state.currentImageIndex) {
      this.setState({currentImageIndex: 0});
    }
  }

  componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS): void {
    if (prevState.currentImageIndex !== this.state.currentImageIndex) {
      if (this.props.images && this.props.images[this.state.currentImageIndex]) {
        axios.get('./getMeta.rdf').then(response => {
          sendQuery(response.data.replace('<bind>', `<${this.props.images[this.state.currentImageIndex].ref}>`)).then(results => {
            this.setState({ imageMeta: results });
          });
        });
      }
    }
  }

  cancelSpeak = () => {
    synth.cancel();
    speechUtteranceChunker.cancel = true;
    this.setState({speaking: false});
  };

  onChangeImageIndex = (index) => {
    this.setState({currentImageIndex: index});
  };

  toggleSpeak = () => {
    if (this.state.speaking) {
      this.cancelSpeak();
    }
    else {
      const utterance = new SpeechSynthesisUtterance(this.props.description);

      const voiceArr = synth.getVoices();
      for (let i = 0; i < voiceArr.length; i++) {
        if ('nl-NL' === voiceArr[i].lang) {
          utterance.voice = voiceArr[i];
        }
      }
      utterance.rate = 0.7;

      speechUtteranceChunker(utterance, {
        chunkLength: 120
      }, _.bind(function () {
        this.setState({speaking: false});
      }, this));

      this.setState({speaking: true});
    }
  };

  handleExpandClick = () => {
    this.setState({ expanded: !this.state.expanded })
  };

  render() {
    const { classes } = this.props;
    const date = moment(this.props.date);

    return (
      <React.Fragment>
        <Container id="back-to-top-anchor">
          <Slider images={this.props.images} onChangeIndex={this.onChangeImageIndex} />

          { this.state.imageMeta &&
            <div>
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: this.state.expanded,
                })}
                onClick={this.handleExpandClick}
                aria-expanded={this.state.expanded}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </IconButton>

              <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                <CardContent>
                  { this.state.imageMeta.creators &&
                    <Typography><strong>Auteur:</strong>&nbsp;
                      { this.state.imageMeta.creators.map(creator => { return (<React.Fragment key={creator}>{creator}</React.Fragment>); }) }
                    </Typography>
                  }

                  { this.state.imageMeta.labels &&
                    <Typography><strong>Label:</strong>&nbsp;
                      { this.state.imageMeta.labels.map(label => { return (<React.Fragment key={label}>{label}</React.Fragment>); }) }
                    </Typography>
                  }

                  { this.state.imageMeta.rights &&
                    <Typography><strong>Rechten:</strong>&nbsp;
                      { this.state.imageMeta.rights.map(right => { return (<React.Fragment key={right}>{right}</React.Fragment>); }) }
                    </Typography>
                  }
                </CardContent>
              </Collapse>
            </div>
          }

          <Typography variant="h5" component="h2">{date.format('dddd D MMMM YYYY')}</Typography>

          <Fab className={classes.speak} color="secondary" aria-label="speak" variant="extended" onClick={this.toggleSpeak}>
            { this.state.speaking ? (<React.Fragment><VolumeOffIcon/> Stop voorlezen</React.Fragment>) : (<React.Fragment><VolumeUpIcon/> Voorlezen</React.Fragment>) }
          </Fab>

          <Typography variant="body1" component="p">{this.props.description}</Typography>
        </Container>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(Detail);
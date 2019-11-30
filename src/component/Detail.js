import React from 'react';
import moment from 'moment';
import {Box, Container, Fab} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import Typography from '@material-ui/core/Typography';
import _ from 'underscore';
import Slider from './Slider';
import speechUtteranceChunker from '../lib/chunker';

const synth = window.speechSynthesis;

const styles = ({spacing}) => ({
  speak: {
    marginBottom: spacing(2),
    marginTop: spacing(2),
  }
});

class Detail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      speaking: false
    };
  }

  cancelSpeak = () => {
    synth.cancel();
    speechUtteranceChunker.cancel = true;
    this.setState({speaking: false});
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

  render() {
    const { classes } = this.props;
    const date = moment(this.props.date);

    return (
      <React.Fragment>
        <Container id="back-to-top-anchor">
          <Slider images={this.props.images} />

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
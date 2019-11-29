import React from 'react';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Slider from './Slider';

const useStyles = makeStyles({
  card: {
    minWidth: 275,
  }
});

const Detail = props => {
  const classes = useStyles();
  const date = moment(props.date);

  return (
    <Card className={classes.card}>
      <CardContent>
        <Slider images={props.images} />
        <Typography variant="h5" component="h2">{date.format('dddd D MMMM YYYY')}</Typography>
        <Typography variant="body1" component="p">{props.description}</Typography>
      </CardContent>
    </Card>
  );
};

export default Detail;
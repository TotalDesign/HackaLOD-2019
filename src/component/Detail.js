import React from 'react';
import moment from 'moment';
import Slider from './Slider';

const Detail = props => {
  const date = moment(props.date);
  return (
    <div>
      <Slider images={props.images} />
      <h1>{date.format('dddd D MMMM YYYY')}</h1>
      <p>{props.description}</p>
    </div>
  );
};

export default Detail;
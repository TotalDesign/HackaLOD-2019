import React from 'react';
import SwipeableViews from 'react-swipeable-views';

const Slider = props => {
  if (props.images) {
    return (
      <SwipeableViews containerStyle={{ height: '250px', textAlign: 'center', marginBottom: '1rem' }} slideStyle={{ overflow: 'hidden' }} enableMouseEvents>
        {props.images.map(image => {
          return (
            <img src={image.small} key={image.ref} style={{ height: '100%' }}/>
          );
        })}
      </SwipeableViews>
    );
  }
  else {
    return (
      <div />
    );
  }
};

export default Slider;
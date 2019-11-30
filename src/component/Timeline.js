import React from 'react';
import * as d3 from 'd3/build/d3';
import eventDrops from 'event-drops';
import styles from './Timeline.module.scss';

class Timeline extends React.Component {
  componentDidMount(): void {
    const repositoriesData = [
      {
        name: 'HAL',
        data: this.props.items.map((item, index) => ({date: item.date, index, ref: item.ref}))
      }
    ];

    const chart = eventDrops({
      d3,
      drop: {
        date: d => new Date(d.date),
        onClick: data => {
          this.props.onChangeIndex(data.index);
        },
      },
      range: {
        start: this.props.items[0].date,
        end: this.props.items[this.props.items.length -1].date,
      },
      indicator: false,
      label: {
        padding: 0,
        width: 0,
      },
    });

    d3
      .select('#eventdrops-demo')
      .data([repositoriesData])
      .call(chart);
  }

  render() {
    return(
      <div style={{margin: '1rem 0 1rem'}}>
        <div id="eventdrops-demo" style={{width: '100vw', height: '60px'}}></div>
      </div>
    );
  }
}

export default Timeline;

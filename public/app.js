dc.constants.EVENT_DELAY = 0;

var state = {
    step: undefined,
    steps: {},
    colors: {
      exceed: {
        unsafe: '#FF4500',
        safe: '#00BFFF'
      },
      weather: {
        // 'dry': '#D1E231',
        // dry: '#CCAD3A',
        // dry: '#B2DF8A',
        dry: '#FF7F00',
        wet: '#33A02C'
        // wet: '#A6CEE3'
        // wet: '#EA6CDD'
      }
    },
    standard: {
      label: 'Boating Standard',
      value: 1260
    },
    weather: {
      precip48: 0.25
    },
    charts: {}
  };

state.steps.step1 = {
  enter: function () {
    d3.select('.chart-container').append('div').attr('id', 'map');
    this.map = L.map('map').setView([42.41, -71.075], 14);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.marker([42.4175, -71.073283]).addTo(this.map)
      .bindPopup('Station: <strong>MAR036</strong><br>Organization: <strong>Mystic River Watershed Association</strong>')
      .on('mouseover', function (e) {
        this.openPopup();
      })
      .on('mouseout', function (e) {
        this.closePopup();
      });
    // L.marker([42.4053, -71.07191]).addTo(this.map)
    //   .bindPopup('Station: <strong>MWRA176</strong><br>Organization: <strong>Massachusetts Water Resources Authority</strong>')
    //   .on('mouseover', function (e) {
    //     this.openPopup();
    //   })
    //   .on('mouseout', function (e) {
    //     this.closePopup();
    //   });
  },
  exit: function (done) {
    this.map.remove();
    d3.select('#map').remove();
    done();
  }
};

state.steps.step2 = {
  enter: function () {
    if (!state.charts.ts) {
      state.charts.ts = tsChart(d3.select('#chart-ts'));
    }

    state.charts.ts
      .colors(['#444'])
      .on('renderlet', function(chart) {
        var tip = state.charts.ts.tip();

        chart.select("svg").call(tip);

        chart.selectAll("path.symbol")
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);
      })
      .render();

    d3.select('#chart-ts').style('display', 'block');
  },
  exit: function (done) {
    d3.select('#chart-ts').style('display', 'none');

    done();
  }
};

state.steps.step3 = {
  enter: function () {
    d3.select('#step3-footnote').style('display', 'block');

    if (!state.charts.ts) {
      state.charts.ts = tsChart(d3.select('#chart-ts'));
    }

    var colors = state.colors.exceed;
    state.charts.ts
      .colors(d3.scale.ordinal().domain(['High Risk', 'Low Risk']).range([colors.unsafe, colors.safe]))
      .colorAccessor(function (d) {
        if (d) {
          return d.key[3] < state.standard.value ? 'Low Risk' : 'High Risk';
        }
      })
      .on('renderlet', function(chart) {
        var tip = state.charts.ts.tip();

        chart.select("svg").call(tip);

        chart.selectAll("path.symbol")
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);

        var extra_data = [
          {
            x: chart.x().range()[0],
            y: chart.y()(state.standard.value)
          }, {
            x: chart.x().range()[1],
            y: chart.y()(state.standard.value)
          }
        ];

        var line = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate('linear');

        var chartBody = chart.select('g.chart-body');

        var path = chartBody.selectAll('path.extra').data([extra_data]);
        path.enter().append('path').attr({
          class: 'extra',
          stroke: 'red',
          id: 'hline',
          'stroke-dasharray': '5,5'
        });
        path.attr('d', line);

        var text = chartBody.selectAll('text.hline-label').data([0]);

        text.enter()
          .append('text')
            .attr('text-anchor', 'end')
            .attr('class', 'hline-label')
            .attr('dy', '-0.5em');
        text.text(state.standard.label)
            .attr('x', chart.x().range()[1])
            .attr('y', chart.y()(state.standard.value));
      })
      .render();

    d3.select('#chart-ts').style('display', 'block');
  },
  exit: function (done) {
    d3.select('#step3-footnote').style('display', 'none');

    d3.select('#chart-ts').style('display', 'none');

    done();
  }
};

state.steps.step4 = {
  enter: function () {
    state.steps.step3.enter();
    d3.select('#step3-footnote').style('display', 'none');

    if (!state.charts.exceed) {
      state.charts.exceed = exceedChart(d3.select('#chart-exceed'));
    }

    state.charts.exceed.render();
    d3.select('#chart-exceed').style('display', 'block');
  },
  exit: function (done) {
    state.charts.exceed.filterAll();

    d3.select('#chart-ts').style('display', 'none');
    d3.select('#chart-exceed').style('display', 'none');

    done();
  }
};

state.steps.step5 = {
  enter: function () {
    var valueFormat = d3.format('.2f');

    if (!state.charts.precip) {
      state.charts.precip = precipChart(d3.select('#chart-precip'));
    }

    if (!state.charts.weather) {
      state.charts.weather = weatherChart(d3.select('#chart-weather'));
    }

    // reset dimension
    state.weather.precip48 = 0.25;
    state.charts.weather.filterAll();
    state.xf.weather.dim.dispose();
    state.xf.weather.dim = state.ndx.dimension(function (d) {
      return d.precip48 >= state.weather.precip48 ? "Wet" : "Dry";
    });
    state.xf.weather.group = state.xf.weather.dim.group();

    state.charts.weather
      .dimension(state.xf.weather.dim)
      .group(state.xf.weather.group)
      .render();

    d3.select('#chart-weather').style('display', 'block');

    state.charts.precip.x().domain([0, 2.5]);
    state.charts.precip.render();

    d3.select('#chart-precip').style('display', 'block');
  },
  exit: function (done) {
    state.charts.weather.filterAll();

    d3.select('#chart-precip').style('display', 'none');
    d3.select('#chart-weather').style('display', 'none');

    done();
  }
};

state.steps.step6 = {
  enter: function () {
    d3.select('#step6-additional-annotation').style('display', 'none');
    state.steps.step5.enter();

    if (!state.charts.exceed) {
      state.charts.exceed = exceedChart(d3.select('#chart-exceed'));
    }

    d3.select('#chart-exceed').style('top', '220px');

    state.charts.exceed.render();

    d3.select('#chart-exceed').style('display', 'block');

    d3.select('#step6-btn-select').on('click', function () {
      state.charts.weather.filterAll();
      state.charts.weather.filter('Wet');
      d3.select('#step6-additional-annotation').style('display', 'block');
      d3.select('#step6-btn-select').style('display', 'none');
      d3.select('#step6-btn-reset').style('display', 'block');
      dc.redrawAll();
    });

    d3.select('#step6-btn-reset').on('click', function () {
      state.charts.weather.filterAll();
      d3.select('#step6-additional-annotation').style('display', 'none');
      d3.select('#step6-btn-select').style('display', 'block');
      d3.select('#step6-btn-reset').style('display', 'none');
      dc.redrawAll();
    })

    // d3.select('#slider-weather-container').style('display', 'block');
    // $('#slider-weather').slider({
    //   value: state.weather.precip48,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.05,
    //   slide: function (event, ui) {
    //     $('#slider-weather-value').text(ui.value + ' inches');
    //     state.weather.precip48 = ui.value;

    //     var filters = state.charts.weather.filters();

    //     // reset dimension
    //     state.charts.weather.filter(null);
    //     state.xf.weather.dim.dispose();
    //     state.xf.weather.dim = state.ndx.dimension(function (d) {
    //       return d.precip48 >= state.weather.precip48 ? "Wet" : "Dry";
    //     });
    //     state.xf.weather.group = state.xf.weather.dim.group();

    //     state.charts.weather
    //       .dimension(state.xf.weather.dim)
    //       .group(state.xf.weather.group)
    //       .filter([filters])
    //       .redraw();

    //     state.charts.precip.redraw();
    //     state.charts.exceed.redraw();
    //   }
    // });
    // $('#slider-weather-value').text($('#slider-weather').slider('value') + ' inches');
  },
  exit: function (done) {
    d3.select('#chart-weather').style('display', 'none');
    d3.select('#chart-precip').style('display', 'none');
    d3.select('#chart-exceed').style('top', '0').style('display', 'none');

    state.charts.weather.filterAll();
    state.charts.exceed.filterAll();

    // d3.select('#slider-weather-container').style('display', 'none');

    done();
  }
};

state.steps.step7 = {
  enter: function () {
    d3.select('#step7-additional-annotation').style('display', 'none');

    state.steps.step5.enter();

    if (!state.charts.exceed) {
      state.charts.exceed = exceedChart(d3.select('#chart-exceed'));
    }

    d3.select('#chart-exceed').style('top', '220px');

    state.charts.exceed.render();

    d3.select('#chart-exceed').style('display', 'block');

    d3.select('#step7-btn-select').on('click', function () {
      state.charts.weather.filterAll();
      state.charts.weather.filter('Dry');
      d3.select('#step7-additional-annotation').style('display', 'block');
      d3.select('#step7-btn-select').style('display', 'none');
      d3.select('#step7-btn-reset').style('display', 'block');
      dc.redrawAll();
    });

    d3.select('#step7-btn-reset').on('click', function () {
      state.charts.weather.filterAll();
      d3.select('#step7-additional-annotation').style('display', 'none');
      d3.select('#step7-btn-select').style('display', 'block');
      d3.select('#step7-btn-reset').style('display', 'none');
      dc.redrawAll();
    })

    // d3.select('#slider-weather-container').style('display', 'block');
    // $('#slider-weather').slider({
    //   value: state.weather.precip48,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.05,
    //   slide: function (event, ui) {
    //     $('#slider-weather-value').text(ui.value + ' inches');
    //     state.weather.precip48 = ui.value;

    //     var filters = state.charts.weather.filters();

    //     // reset dimension
    //     state.charts.weather.filter(null);
    //     state.xf.weather.dim.dispose();
    //     state.xf.weather.dim = state.ndx.dimension(function (d) {
    //       return d.precip48 >= state.weather.precip48 ? "Wet" : "Dry";
    //     });
    //     state.xf.weather.group = state.xf.weather.dim.group();

    //     state.charts.weather
    //       .dimension(state.xf.weather.dim)
    //       .group(state.xf.weather.group)
    //       .filter([filters])
    //       .redraw();

    //     state.charts.precip.redraw();
    //     state.charts.exceed.redraw();
    //   }
    // });
    // $('#slider-weather-value').text($('#slider-weather').slider('value') + ' inches');
  },
  exit: function (done) {
    d3.select('#chart-weather').style('display', 'none');
    d3.select('#chart-precip').style('display', 'none');
    d3.select('#chart-exceed').style('top', '0').style('display', 'none');

    state.charts.weather.filterAll();
    state.charts.exceed.filterAll();

    // d3.select('#slider-weather-container').style('display', 'none');

    done();
  }
};

state.steps.step8 = {
  enter: function () {
    d3.select('#img-explore').style('display', 'block');
  },
  exit: function (done) {
    d3.select('#img-explore').style('display', 'none');
    done();
  }
};

d3.selectAll('.btn-step').on('click', function () {
  var step = d3.select(this).attr('id');
  switchStep(step);
});

// function selectWet() {
//   state.charts.weather.filterAll();
//   state.charts.weather.filter('Wet');
//   dc.redrawAll();
//   d3.select('#step6-additional-annotation').style('display', 'block');
// }

function selectDry() {
  state.charts.weather.filterAll();
  state.charts.weather.filter('Dry');
  dc.redrawAll();
  d3.select('#step7-additional-annotation').style('display', 'block');
}

function switchStep (step) {
  d3.selectAll('.btn-step').classed('btn-primary', false).classed('btn-default', true);
  d3.select('#' + step).classed('btn-default', false);
  d3.select('#' + step).classed('btn-primary', true);
  switchAnnotation(step);

  if (state.step) {
    state.steps[state.step].exit(function () {
      state.step = step;
      state.steps[step].enter();
    });
  } else {
    state.step = step;
    state.steps[step].enter();
  }
}

function switchAnnotation (step) {
  d3.selectAll('.annotation').style('display', 'none');
  d3.select('#' + step + '-annotation').style('display', 'block');
}

function initialize () {
  var isoFormat = d3.time.format.utc("%Y-%m-%dT%H:%M:%SZ");

  d3.csv('data/wq.csv')
    .row(function (d) {
      return {
        id: +d.id,
        site: d.site,
        param: d.param,
        datetime: isoFormat.parse(d.datetime),
        value: +d.value,
        precip: +d.precip,
        precip48: +d.precip48,
      }
    })
    .get(function (error, rows) {
      if (error) {
        console.log("Error: ", error);
        return;
      }

      // keep only ECOLI data collected through 2015 (exclude 2016 data)
      state.data = rows.filter(function (d) {
        return d.param === "ECOLI" && d.datetime.getFullYear() <= 2015 && d.site === 'MAR036';
      });

      state.ndx = crossfilter(state.data);
      state.all = state.ndx.groupAll();

      state.xf = {};

      state.xf.time = {};
      state.xf.time.dim = state.ndx.dimension(function (d) {
        return [d.id, d.site, d.datetime, d.value];
      });
      state.xf.time.group = state.xf.time.dim.group();

      state.xf.exceed = {};
      state.xf.exceed.dim = state.ndx.dimension(function (d) {
        return d.value < state.standard.value ? "Low Risk" : "High Risk";
      });
      state.xf.exceed.group = state.xf.exceed.dim.group();

      state.xf.precip = {};
      state.xf.precip.dim = state.ndx.dimension(function (d) {
        return [d.id, d.site, d.datetime, d.precip48, d.value];
      });
      state.xf.precip.group = state.xf.precip.dim.group();

      state.xf.weather = {};
      state.xf.weather.dim = state.ndx.dimension(function (d) {
        return d.precip48 >= state.weather.precip48 ? "Wet" : "Dry";
      });
      state.xf.weather.group = state.xf.weather.dim.group();

      // state.xf.month = {};
      // state.xf.month.dim = state.ndx.dimension(function (d) {
      //   return months[d.datetime.getMonth()];
      // });
      // state.xf.month.group = state.xf.month.dim.group();

      state.xf.site = {};
      state.xf.site.dim = state.ndx.dimension(function (d) {
        return d.site;
      });
      state.xf.site.group = state.xf.site.dim.group();

      // remove loading frame
      d3.select('.loading')
        .transition()
        .delay(0)
        .duration(1000)
        .style('opacity', 0)
        .each("end", function (d) {
          d3.select(this).style('display', 'none');
        });

      switchStep('step1');
    });
}

function tsChart(el) {
  var valueFormat = d3.format(",.0f");
  var datetimeFormat = d3.time.format("%x %X");

  var timeScale = d3.time.scale()
    .domain(d3.extent(state.data, function(d) { return d.datetime; }));
  var ecoliScale = d3.scale.log()
    .domain([1, d3.max(state.data, function(d) { return d.value; }) * 2]);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<span>Station: </span> <strong>" + d.key[1] + "</strong><br>" +
             "<span>Datetime: </span> <strong>" + datetimeFormat(d.key[2]) + "</strong><br>" +
             "<span>E. coli: </span> <strong>" + valueFormat(d.key[3]) + " #/100mL</strong>";
    });

  var chart = dc.scatterPlot(el)
    .width(550)
    .height(250)
    .margins({top: 10, right: 50, bottom: 30, left: 50})
    .x(timeScale)
    .y(ecoliScale)
    .brushOn(false)
    .yAxisLabel('E. coli (#/100mL)')
    .xAxisLabel('Date')
    .clipPadding(10)
    .dimension(state.xf.time.dim)
    .group(state.xf.time.group)
    .keyAccessor(function (d) {
      return d.key[2];
    })
    .valueAccessor(function (d) {
      return d.key[3];
    })
    .excludedOpacity(0.5)
    .transitionDuration(500);

  // access tip function for customizing renderlet events
  chart.tip = function () {
    return tip;
  }

  var tickValues = [];
  [0, 1, 2, 3, 4, 5].forEach(function (exp) {
    [1, 2, 5].forEach(function (i) {
      tickValues.push(i*Math.pow(10, exp));
    });
  });
  chart.yAxis().tickFormat(function (d) {
    return tickValues.indexOf(d) >= 0 ? valueFormat(d) : "";
  });

  return chart;
}

function precipChart (el) {
  var datetimeFormat = d3.time.format("%x %X"),
      valueFormat = d3.format(",.0f"),
      precipFormat = d3.format(",.2f");

  var ecoliScale = d3.scale.log()
    .domain([1, d3.max(state.data, function(d) { return d.value; }) * 2]);
  var precipScale = d3.scale.linear()
    .domain([0, d3.max(state.data, function(d) { return d.precip48; })]);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<span>Station: </span> <strong>" + d.key[1] + "</strong><br>" +
             "<span>Datetime: </span> <strong>" + datetimeFormat(d.key[2]) + "</strong><br>" +
             "<span>E. coli: </span> <strong>" + valueFormat(d.key[4]) + " #/100mL</strong><br>" +
             "<span>48-hour Rainfall: </span> <strong>" + precipFormat(d.key[3]) + " inches</strong>";
    });

  var colors = state.colors.weather;

  var chart = dc.seriesChart(el)
    .width(550)
    .height(400)
    .margins({top: 10, right: 50, bottom: 30, left: 50})
    .x(precipScale)
    .y(ecoliScale)
    .brushOn(false)
    .yAxisLabel('E. coli (#/100mL)')
    .xAxisLabel('Previous 48-hour Rainfall (inches)')
    .clipPadding(10)
    .transitionDuration(500)
    .dimension(state.xf.precip.dim)
    .group(state.xf.precip.group)
    .keyAccessor(function (d) {
      return d.key[3];
    })
    .valueAccessor(function (d) {
      return d.key[4];
    })
    .seriesAccessor(function(d) {
      return d.key[3] < state.weather.precip48 ? "Dry" : "Wet";
    })
    .colors(d3.scale.ordinal().domain(['Dry', 'Wet']).range([colors.dry, colors.wet]))
    // .colorAccessor(function (d) {
    //   if (d) {
    //     return d.key[0] < state.weather.precip48 ? "Dry" : "Wet";
    //   }
    // })
    .chart(function (c) {
      return dc.scatterPlot(c)
        .symbol('circle');
    })
    .legend(dc.legend().x(400).y(10).itemHeight(13).gap(5))
    .on('renderlet', function(chart) {
      var tip = state.charts.precip.tip();

      chart.select("svg").call(tip);
      chart.selectAll("path.symbol")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      var extra_data = [
        {
          x: chart.x()(state.weather.precip48),
          y: chart.y().range()[0]
        }, {
          x: chart.x()(state.weather.precip48),
          y: chart.y().range()[1]
        }
      ];
      var line = d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate('linear');

      var chartBody = chart.select('g.chart-body');
      var path = chartBody.selectAll('path.extra').data([extra_data]);
      path.enter().append('path').attr({
        class: 'extra',
        stroke: state.colors.weather.wet,
        id: 'vline',
        'stroke-dasharray': '5,5'
      });
      path.attr('d', line);

      var text = chartBody.selectAll('text.vline-label').data([0]);

      text.enter()
        .append('text')
        .attr('class', 'vline-label');

      text.text('Rainfall Threshold = ' + state.weather.precip48 + ' in');

      if (state.weather.precip48 <= 1.5) {
        // right side of vline
        text
          .attr('text-anchor', 'start')
          .attr('dx', '0.5em')
          .attr('dy', '-0.5em');
      } else {
        // left side of vline
        text
          .attr('text-anchor', 'end')
          .attr('dx', '-0.5em')
          .attr('dy', '-0.5em');
      }

      text.attr('x', chart.x()(state.weather.precip48))
          .attr('y', chart.y().range()[0]);

      // horizontal line
      extra_data = [
        {
          x: chart.x().range()[0],
          y: chart.y()(state.standard.value)
        }, {
          x: chart.x().range()[1],
          y: chart.y()(state.standard.value)
        }
      ];

      path = chartBody.selectAll('path.hline').data([extra_data]);
      path.enter().append('path').attr({
        class: 'hline',
        stroke: 'red',
        id: 'hline',
        'stroke-dasharray': '5,5'
      });
      path.attr('d', line);

      var text = chartBody.selectAll('text.hline-label').data([0]);

      text.enter()
        .append('text')
          .attr('text-anchor', 'end')
          .attr('class', 'hline-label')
          .attr('dy', '-0.5em');
      text.text(state.standard.label)
          .attr('x', chart.x().range()[1])
          .attr('y', chart.y()(state.standard.value));
    });

  chart.tip = function () {
    return tip;
  };

  var tickValues = [];
  [0, 1, 2, 3, 4, 5].forEach(function (exp) {
    [1, 2, 5].forEach(function (i) {
      tickValues.push(i*Math.pow(10, exp));
    });
  });
  chart.yAxis().tickFormat(function (d) {
    return tickValues.indexOf(d) >= 0 ? valueFormat(d) : "";
  });

  return chart;
}

function exceedChart (el) {
  var colors = state.colors.exceed;
  var chart = dc.pieChart(el)
    .width(280)
    .height(200)
    .innerRadius(30)
    .radius(60)
    .externalLabels(40)
    .drawPaths(true)
    .minAngleForLabel(0)
    .label(function (d) {
      if (state.charts.exceed.hasFilter() &&
          !state.charts.exceed.hasFilter(d.key)) {
          return d.key + ' (0%)';
      }
      var label = d.key;
      if (state.all.value()) {
          label += ' (' + Math.round(d.value / state.all.value() * 100) + '%)';
      }
      return label;
    })
    .dimension(state.xf.exceed.dim)
    .group(state.xf.exceed.group)
    .transitionDuration(500)
    .colors(d3.scale.ordinal().domain(['High Risk', 'Low Risk']).range([colors.unsafe, colors.safe]))
    .colorAccessor(function (d) {
      return d.key;
    });

  return chart;
}

function weatherChart (el) {
  var colors = state.colors.weather;
  var chart = dc.pieChart(el)
    .width(270)
    .height(180)
    .innerRadius(30)
    .radius(60)
    .externalLabels(20)
    .drawPaths(true)
    .minAngleForLabel(0)
    .dimension(state.xf.weather.dim)
    .group(state.xf.weather.group)
    .transitionDuration(500)
    .colors(d3.scale.ordinal().domain(['Dry', 'Wet']).range([colors.dry, colors.wet]))
    .colorAccessor(function (d) {
      return d.key;
    });

  chart.label(function (d) {
    if (chart.hasFilter() &&
        !chart.hasFilter(d.key)) {
        return d.key + ' (0%)';
    }
    var label = d.key;
    if (state.all.value()) {
        label += ' (' + Math.round(d.value / state.all.value() * 100) + '%)';
    }
    return label;
  });

  return chart
}

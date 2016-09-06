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
        dry: '#FF7F00',
        wet: '#33A02C'
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
    });
  },
  exit: function (done) {
    d3.select('#chart-weather').style('display', 'none');
    d3.select('#chart-precip').style('display', 'none');
    d3.select('#chart-exceed').style('top', '0').style('display', 'none');

    d3.select('#step6-btn-select').style('display', 'block');
    d3.select('#step6-btn-reset').style('display', 'none');

    state.charts.weather.filterAll();
    state.charts.exceed.filterAll();

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
    });
  },
  exit: function (done) {
    d3.select('#chart-weather').style('display', 'none');
    d3.select('#chart-precip').style('display', 'none');
    d3.select('#chart-exceed').style('top', '0').style('display', 'none');

    d3.select('#step7-btn-select').style('display', 'block');
    d3.select('#step7-btn-reset').style('display', 'none');

    state.charts.weather.filterAll();
    state.charts.exceed.filterAll();

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

function initializeNarrative () {
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

      state.data = rows;

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

function initializeExplorer () {
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
      var valueFormat = d3.format('.2f');
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      if (error) {
        console.log("Error: ", error);
        return;
      }

      state.data = rows;

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

      state.xf.month = {};
      state.xf.month.dim = state.ndx.dimension(function (d) {
        return months[d.datetime.getMonth()];
      });
      state.xf.month.group = state.xf.month.dim.group();

      state.xf.year = {};
      state.xf.year.dim = state.ndx.dimension(function (d) {
        return d.datetime.getFullYear();
      });
      state.xf.year.group = state.xf.year.dim.group();

      state.xf.site = {};
      state.xf.site.dim = state.ndx.dimension(function (d) {
        return d.site;
      });
      state.xf.site.group = state.xf.site.dim.group();

      d3.select('#chart-ts').style('left', '280px').style('top', '60px');
      d3.select('#chart-exceed').style('left', '0').style('top', '60px');
      d3.select('#chart-precip').style('left', '280px').style('top', '360px');
      d3.select('#chart-weather').style('left', '0').style('top', '360px');
      d3.select('#chart-month').style('left', '800px').style('top', '60px');
      d3.select('#chart-year').style('left', '800px').style('top', '360px');
      d3.select('#slider-weather-container').style('left', '357px').style('top', '630px');
      d3.select('#toolbar-btn').style('right', '0').style('top', '0');

      state.charts.ts = tsChart(d3.select('#chart-ts'));
      state.charts.ts
        .colors(d3.scale.ordinal()
                  .domain(['High Risk', 'Low Risk'])
                  .range([state.colors.exceed.unsafe, state.colors.exceed.safe]))
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
        });

      state.charts.exceed = exceedChart(d3.select('#chart-exceed')).height(250);

      state.charts.precip = precipChart(d3.select('#chart-precip'))
        .height(250)
        .transitionDuration(0);
      state.charts.precip.x().domain([0, 2.5]);

      state.charts.weather = weatherChart(d3.select('#chart-weather'));
      state.charts.weather
        .height(250)
        .dimension(state.xf.weather.dim)
        .group(state.xf.weather.group);

      state.charts.month = dc.barChart('#chart-month');
      state.charts.month
        .width(380)
        .height(235)
        .colors(['#666'])
        .x(d3.scale.ordinal().domain(months))
        .yAxisLabel("# of Samples")
        .xUnits(dc.units.ordinal)
        .dimension(state.xf.month.dim)
        .group(state.xf.month.group);

      state.charts.year = dc.barChart('#chart-year');
      state.charts.year
        .width(380)
        .height(235)
        .colors(['#666'])
        .x(d3.scale.ordinal())
        .yAxisLabel("# of Samples")
        .xUnits(dc.units.ordinal)
        .dimension(state.xf.year.dim)
        .group(state.xf.year.group);

      $('#slider-weather').slider({
        value: state.weather.precip48,
        min: 0.1,
        max: 2,
        step: 0.05,
        slide: function (event, ui) {
          $('#slider-weather-value').text(ui.value + ' inches');
          state.weather.precip48 = ui.value;

          var filters = state.charts.weather.filters();

          // reset dimension
          state.charts.weather.filter(null);
          state.xf.weather.dim.dispose();
          state.xf.weather.dim = state.ndx.dimension(function (d) {
            return d.precip48 >= state.weather.precip48 ? "Wet" : "Dry";
          });
          state.xf.weather.group = state.xf.weather.dim.group();

          state.charts.weather
            .dimension(state.xf.weather.dim)
            .group(state.xf.weather.group)
            .filter([filters])
            .redraw();

          dc.redrawAll();
        }
      });
      $('#slider-weather-value').text($('#slider-weather').slider('value') + ' inches');

      dc.renderAll();

      d3.select('.loading')
        .transition()
        .delay(500)
        .duration(1000)
        .style('opacity', 0)
        .each("end", function (d) {
          d3.select(this).style('display', 'none');
          startTour();
        });
    });
}

function updateRecreation (selected) {
  var options = {
    swim: {
      label: 'Swimming Standard',
      value: 235
    },
    boat: {
      label: 'Boating Standard',
      value: 1260
    }
  }

  state.standard = options[selected];

  var filters = state.charts.exceed.filters();

  // reset dimension
  state.charts.exceed.filter(null);
  state.xf.exceed.dim.dispose();
  state.xf.exceed.dim = state.ndx.dimension(function (d) {
    return d.value < state.standard.value ? "Low Risk" : "High Risk";
  });
  state.xf.exceed.group = state.xf.exceed.dim.group();

  state.charts.exceed
    .dimension(state.xf.exceed.dim)
    .group(state.xf.exceed.group)
    .filter([filters]);

  dc.redrawAll();
}

function resetAll() {
  dc.filterAll();
  dc.redrawAll();
}

function startTour () {
  var intro = introJs();
  intro.setOptions({
    showStepNumbers: false,
    steps: [
      {
        intro: '<p class="text-center" style="font-size:20px">Welcome to the<br><strong>Data Explorer</strong><br>for<br><strong>Bacteria Levels and Public Health Risks on the Malden River</strong></p><p>Click Next to begin the tour of this dashboard, or Skip to quit the tour and get right to exploring the data.</p>'
      },
      {
        element: '#chart-ts',
        intro: '<p>This chart shows monthly E. coli levels measured by MyRWA at station MAR036 over time.</p><p>Each circle represents one sample and is colored based on whether it is above (red) or below (blue) the water quality standard for the selected type of recreation.</p>'
      },
      {
        element: '#chart-exceed',
        intro: '<p>The fraction of all samples representing high and low public health risks.<p><p>You can click on either segment of the chart to select only samples with high or low public health risk.</p>'
      },
      {
        element: '.form-group',
        intro: '<p>Use this dropdown to select which type of recreation you are interested in.</p><p>Changing this option will change the state water quality standard used to determine which samples pose high and low public health risks.</p>'
      },
      {
        element: '#chart-precip',
        intro: '<p>This chart shows the relationship between E. coli levels and the amount of rainfall over the 48 hours before each sample was collected.</p><p>Each point is colored based on whether the sample is associated with wet or dry weather.</p>',
        position: 'top'
      },
      {
        element: '#chart-weather',
        intro: '<p>The fraction of all samples that were collected after wet and dry weather.</p><p>You can click on either segment of the chart to select only samples associated with each category.</p>',
        position: 'top'
      },
      {
        element: '#slider-weather-container',
        intro: '<p>Use this slider to change the rainfall threshold that determines which samples were collected after dry or wet weather.</p><p>Increasing the threshold means that more rainfall must occur in order for a sample to be associated with wet weather.</p>',
        position: 'top'
      },
      {
        element: '#chart-month',
        intro: '<p>This chart shows the number of samples collected in each month of the year.</p><p>You can click on one or more of the bars to focus on specific months and seasons. For example, to look at the public health risks during the summer recreational season, select all months from May through September.</p>'
      },
      {
        element: '#chart-year',
        intro: '<p>This chart shows the number of samples collected in each year.</p><p>You can click on one or more bars to focus on shorter periods of the dataset. For example, to explore the public health risks based on only the past 5 years of data, select all years from 2011 through 2015.</p>',
        position: 'top'
      },
      {
        element: '#btn-reset',
        intro: '<p>Click this button to reset the dashboard and clear all selections in the charts below.</p>'
      },
      {
        element: '#btn-help',
        intro: '<p>Click this button to repeat this tour.</p>'
      }
    ]
  })
  intro.start();
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

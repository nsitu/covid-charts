var theCountry;
var theData = {};
var doublingLabel = 'Doubling Time in Days';
var casesLabel = 'Confirmed Cases';

// Activate the selectlist navigation
function loadCountry(){
    var selectBox = document.getElementById("theCountries");
    var theValue = selectBox.options[selectBox.selectedIndex].value;
    window.location.href = '#' + theValue;
    window.location.reload(true);
  }
  
// Navigation: redirect to Canada if no country is chosen.
if(window.location.hash) {
  theCountry =  decodeURIComponent(window.location.hash.substring(1));
} else {
  window.location.href = "#Canada";
  window.location.reload(true);
}

// build navigation menu by fetching a list of countries
fetch("/Covid/countries/")
.then(response => response.json())
.then(countries => {
    for (var id in countries){
      var country = countries[id];
      var selected = ''; // mark the current country as selected
      if (theCountry == country){ selected = " selected"; }
      // build options and add them to the select list.
      document.getElementById("theCountries").innerHTML+=
        '<option value="'+country+'" '+selected+'>'+country+'</option>';
    }
});

// fetch data for the current country
fetch("/Covid/"+theCountry)
.then(response => response.json())
.then(theCountry => {

  console.log(theCountry);

  let theData = theCountry['data'];

  // arrays to be populated with chartable data
  let theLabels = [];
  let confirmedCases = [];
  let doublingTime = [];

  let i = 1; // keep track of day #
  let recent = [0,0,0,0,0];  // 5 most recent case counts
  let enabled = false; // we will enable this later

   // iterate through data
  for( var k in theData ) {

    var date = theData[k].date;
    var confirmed = theData[k].total_cases;

       // Enable the chart only when conditions are met:
       // 1. 5-day history can't have blank values.
       // 2. we need at least 50 cases
      if ( !recent.includes(0) && confirmed > 50) { enabled = true; }

      // calculate doubling time over recent days
      var X= [i, i+1, i+2, i+3, i+4];
      var Y= recent;
      var days = Math.log(2) / getSlope(X,Y);
      days = Math.round(days*1000)/1000;

      // skip if all recent values are equal
      // reason: doubling time is infinite, resulting in outliers
      if ( recent.every( (v, i, a) => v === a[0] ) ){
          days = null;
      }
      // add data to the chart arrays
      if (enabled){
          theLabels.push(date);
          confirmedCases.push(confirmed);
          doublingTime.push( days );
      }
      // update the array of recent case counts.
      // everything "slides" over one position.
      recent.shift();
      if (confirmed !=0 ){
        recent.push( Math.log(confirmed) );
      }
      else{
        recent.push( 0 );
      }
      i++; // go to the next day
  }

  /* Build the chart */
  // See also: https://www.chartjs.org/docs/latest/

  // Define the datasets and display styles
  var chartData = {
      labels: theLabels,
      datasets: [{
          label: doublingLabel,
          lineTension: 0,
          data: doublingTime,
          borderColor: 'blue',
          backgroundColor: 'transparent',
          showLine: true,
          yAxisID: 'second-y-axis'
      },
      {
          label: casesLabel,
          lineTension: 0,
          data: confirmedCases,
          borderColor: 'orange',
          backgroundColor: 'transparent',
          showLine: true,
          yAxisID: 'first-y-axis',
          hidden: false
      }
      ]
  }

  // Define properties and display style for the chart axes
  var chartOptions = {
      scales: {
          yAxes: [{
              id: 'first-y-axis',
              type: 'logarithmic',
              position: 'right',
              ticks: {
                  fontColor: 'orange',
                  callback: function(tick, index, ticks) {
                    // use regular numbers, not scientific notation
                    return tick.toLocaleString();
                  }
              },
              scaleLabel: {
                  display: true,
                  fontColor: 'orange',
                  labelString: casesLabel
              }
          },
          {
              id: 'second-y-axis',
              type: 'linear',
              position: 'left',
              ticks: {
                  fontColor: 'blue'
              },
              scaleLabel: {
                  display: true,
                  fontColor: 'blue',
                  labelString: doublingLabel
              }
          }]
      }
  }

  // create a new chart using the above options and render it
  var ctx = document.getElementById('myChart').getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
  });

});

// Math

// getSlope() calculates the slope for our log trendline
// X and Y are arrays of values
// Similar to Excel's slope() function.
// See also: https://stackoverflow.com/questions/43109305/calculate-slope-and-intercept-value-for-logarithmic-trendline-as-excel
function getSlope(X, Y){
  var Slope;
  var SX = 0, SY = 0, SXX = 0, SXY = 0, SYY = 0;
  var SumProduct = 0;
  var N = X.length;
  for (var i = 0; i < N; i++) {
     SX = SX + X[i];
     SY = SY + Y[i];
     SXY = SXY + X[i] * Y[i];
     SXX = SXX + X[i] * X[i];
     SYY = SYY + Y[i] * Y[i];
  }
  Slope = ((N * SXY) - (SX * SY)) / ((N * SXX) - (SX * SX));
  return Slope;
}
const tweaks = {
  name: "Expansive",
  folder: "img/tweaks/",
  grids: ["TBgrid"],
  parameters: [
    {name: "Global risk",          min: 0,      max: 60,     step: 10},
    {name: "Household risk",       min: 0,      max: 60,     step: 10},
    {name: 'P(Initial infection)', min: 0.4,    max: 0.5,    step: 0.05},
    {name: 'Rate of progression',  min: 0.0035, max: 0.1035, step: 0.05}],
  digits: 3
};

const progression = {
  name: "Rapid vs Normal progression",
  folder: "img/progression/",
  grids: ["TBgrid"],
  parameters: [
    {name: "Rapid progression rate", unit:"(events/yr)", min:0, max:0.15, step:0.025},
    {name: "Normal progression rate", unit: "(events/yr)", min: 0.0035, max: 0.0535, step: 0.005}],
  digits: 2
}

const spec = [tweaks, progression];

class GridViewer extends React.Component {
  constructor(props) {
    super(props);

    this.spec = spec;
    const initialRangeIdx = 1;

    this.state = {
      rangeIdx:   initialRangeIdx,
      gridName:   this.spec[initialRangeIdx].grids[0],
      vals:       this.spec[initialRangeIdx].parameters.map(({min}) => min),
      folderName: this.spec[initialRangeIdx].folder, // May NOT need this in state
      imgNum:     1, // Probably will keep, but do not strictly need
      digits:     this.spec[initialRangeIdx].digits // May NOT need this in state
    };
    
    // The two event handlers that deal with sliders and buttons
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleRangeChange = this.handleRangeChange.bind(this);
  }

  handleSliderChange(e) {
    e.preventDefault();

    // Weird lambda-capture stuff - should probably figure out how this works
    const range = this.spec[this.state.rangeIdx];
    const params = range.parameters;

    // Figures out the index of the image to display using the values of the 
    // sliders
    var calcImgNum = function(vals) {

      // Calculate the number of steps for each parameter
      var lengths = params.map(({min, max, step}) => (max-min)/step + 1);

      // The first parameter should be multiplied by 1, and the last parameter
      // should be multiplied by the length of the parameter preceding it.
      // Shift the array to reflect this.
      lengths.unshift(1);
      lengths.pop();
      
      // Multiply (n0, n0*n1, n1*n2*n3), etc to obtain the multipliers
      // for each parameter
      const multipliers = lengths.map(function(i, idx, arr) {
        return arr.slice(0, idx+1).reduce(((acc, cv) => acc*cv), 1);
      });

      // Determine the 'index' that corresponds to each value. I.e., translate
      // the value from the slider (which could be any number) into an unsigned
      // integer between [0, length(parameter)].
      const indices = vals.map((val, idx) => (val - params[idx].min)/params[idx].step);

      // Add all these up to get the (possibly floating-point) index. The images, for now,
      // are 1-index, to the intiial value of the reduction is 1.
      const possiblyFloating = indices.reduce(((acc, cv, idx) => acc + multipliers[idx]*cv), 1);

      // Round to the nearest integer, since sometimes you get really
      // weird values like 49.999999
      return Math.round(possiblyFloating);
    }

    // Extract the value and the parameter associated with the value
    var val = e.target.valueAsNumber;
    var id  = Number.parseInt(e.target.id);

    var vals = this.state.vals;
    vals[id] = val;
  
    // Update the state with new value of the slider,
    // and update the number of the image being displayed
    this.setState({ vals: vals });
    this.setState({ imgNum: calcImgNum(vals) });
  }

  handleRangeChange(e) {
    e.preventDefault();

    // The index of the range to display
    const idx = e.target.id;

    // Reset the sliders to their minumums, the image to the first one
    // in the series, and other state that must be updated.
    this.setState({
      rangeIdx: idx, 
      vals: this.spec[idx].parameters.map(({min}) => min),
      folderName: this.spec[idx].folder,
      imgNum: 1,
      digits: this.spec[idx].digits
    });
  }

  render() {

    // More weird lambda stuff...
    const rangeIdx = this.state.rangeIdx;
    const range = this.spec[rangeIdx];
    const handleRangeChange = this.handleRangeChange;

    const sliderContainers = range.parameters.map((param, idx) =>
      <SliderContainer name={param.name}
                       unit={param.unit}
                       min= {param.min} 
                       max= {param.max} 
                       step={param.step} 
                       id={idx}
                       value={this.state.vals[idx]} 
                       handleChange={this.handleSliderChange}
                       key={idx}/>
    );

    // Use CSS classes to create the button toggle effect. Probably,
    // there is a much more elegant way to do this using React
    const rangeSelectors = this.spec.map(function({name}, idx) {
      var buttonNames = "pure-button";
      buttonNames = buttonNames + ((idx == rangeIdx) ? " pure-button-disabled" : " pure-button-primary");

      return (
        <button className={buttonNames} key={idx} id={idx} onClick={handleRangeChange}>
          {name}
        </button>
      );
    });

    // imgNum can be used to debug which image is being displayed
    return (
      <div className="pure-g">
        <div className="pure-u-1-6">
          <div className="sidebar">
            <form>
              {rangeSelectors}
            </form>
            <form>
              {sliderContainers}
            </form>
            {/*<b>imgNum: {this.state.imgNum}</b><br/>*/}
          </div>
        </div>
        <div className="pure-u-5-6">
          {/* This should be simplified so that it just passes the url of the image*/}
          <GridImage folderName={this.state.folderName}
                     imgNum={this.state.imgNum}
                     digits={this.state.digits}
                     gridName={this.state.gridName} />
        </div>
      </div>
    );
  }
}

// A pad function from the StackOverflow swamp
function pad(num, digits) {
  return ('000000000' + num).substr(-digits);   
}


class GridImage extends React.Component { 
  render() {
    var num = pad(this.props.imgNum, this.props.digits);
    return (
      <div className="content">
        <img src={this.props.folderName + this.props.gridName + "_" + num + ".png"}
             className="grid"/>
      </div>
    );
  }
}

class SliderContainer extends React.Component {
  render() {
    var slider = {
      min:  this.props.min,
      max:  this.props.max,
      step: this.props.step
    };

    return (
      <div className="sliderContainer">
        <h2>{this.props.name}: {this.props.value}</h2>
        <div className="unit">{this.props.unit}</div>
        <Slider id={this.props.id} slider={slider} value={this.props.value} handleChange={this.props.handleChange}/>
      </div>
    );
  }
}

// Props should be:
// 
// id STRING
// slider OBJECT:
//  min
//  max
//  step
// value NUMBER
class Slider extends React.Component {
  render() {
    var id = this.props.id;
    var min = this.props.slider.min;
    var max = this.props.slider.max;
    var step = this.props.slider.step;
    var value = this.props.value;

    return (<input id={id} type="range" min={min} max={max} step={step} style={{width: "350px"}}
                   onChange={this.props.handleChange} value={value}/>);
  }
}

ReactDOM.render(
  <GridViewer />,
  document.getElementById('mount')
);

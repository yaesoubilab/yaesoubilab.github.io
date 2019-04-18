var specOriginal = [
  {name: "Global risk",    min: 0, max: 40, step: 2.5},
  {name: "Household risk", min: 0, max: 20, step: 2},
];

var specTweaks = [
  {name: "Global risk",          min: 0,      max: 60,     step: 10},
  {name: "Household risk",       min: 0,      max: 60,     step: 10},
  {name: 'P(Initial infection)', min: 0.4,    max: 0.5,    step: 0.05},
  {name: 'Rate of progression',  min: 0.0035, max: 0.1035, step: 0.05}
];

var spec = [
  {name: "Rapid progression rate", unit:"(events/yr)", min:0, max:0.15, step:0.025},
  {name: "Normal progression rate", unit: "(events/yr)", min: 0.0035, max: 0.0535, step: 0.005}
];

class GridViewer extends React.Component {
  constructor(props) {
    super(props);

    this.spec = spec;
    
    this.state = { 
      vals: this.spec.map(({min}) => min),
      folderName: 'images_rf_progression/',
      imgNum: 1, 
      digits: 2
    };
    
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    e.preventDefault();

    var calcImgNum = function(vals) {

      var lengths = spec.map(({min, max, step}) => (max-min)/step + 1);
      lengths.unshift(1);
      lengths.pop();
      
      const multipliers = lengths.map(function(i, idx, arr) {
        return arr.slice(0, idx+1).reduce(((acc, cv) => acc*cv), 1);
      });

      const indices = vals.map((val, idx) => (val - spec[idx].min)/spec[idx].step);

      const possiblyFloating = indices.reduce(((acc, cv, idx) => acc + multipliers[idx]*cv), 1);

      return Math.round(possiblyFloating);
    }

    var val = e.target.valueAsNumber;
    var id  = Number.parseInt(e.target.id);

    var vals = this.state.vals;
    vals[id] = val;
  
    this.setState({vals: vals});
    this.setState({ imgNum: calcImgNum(vals) });
  }

  render() {
    const sliderContainers = this.spec.map((param, idx) =>
      <SliderContainer name={param.name}
                       unit={param.unit}
                       min= {param.min} 
                       max= {param.max} 
                       step={param.step} 
                       id={idx}
                       value={this.state.vals[idx]} 
                       handleChange={this.handleChange}
                       key={idx}/>
    );

    return (
      <div className="pure-g">
        <div className="pure-u-1-6">
          <div className="sidebar">
            <form>
              {sliderContainers}
            </form>
            <b>imgNum: {this.state.imgNum}</b><br/>
          </div>
        </div>
        <div className="pure-u-5-6">
          <GridImage folderName={this.state.folderName}
                     imgNum={this.state.imgNum}
                     digits={this.state.digits} />
        </div>
      </div>
    );
  }
}

function pad(num, digits) {
  return ('000000000' + num).substr(-digits);   
}

class GridImage extends React.Component { 
  render() {
    var num = pad(this.props.imgNum, this.props.digits);
    return (
      <div className="content">
        <img src={this.props.folderName + "TBgrid_" + num + ".png"}
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
        <h3>{this.props.unit}</h3>
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

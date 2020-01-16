
var nbSamples = 6;
var color = '#fff';
var strokeColor = '#fff';
var bgColor = '#0099ff';

var bar = new ProgressBar.Circle('#container', {
  color: strokeColor,
  strokeWidth: 4,
  trailColor: bgColor,
  trailWidth: 4,
  easing: 'easeInOut',
  value: 0,
  text: {
    autoStyleContainer: false
  },
  step: function(state, circle) {
    var value = Math.round(circle.value() * 100/(100/nbSamples));
    if (value == 0) {
      circle.setText('waiting for samples<br/><a href="javascript:void(0)" onclick="cancelFingerprinting()">cancel</a>');
    } else if (value == nbSamples) {
      circle.setText('complete');
      onFingerPrintComplete();
    } else {
      circle.setText(value + '/' + nbSamples + ' samples collected<br/><a href="javascript:void(0)" onclick="cancelFingerprinting()">cancel</a>');
    }

  }
});
bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
bar.text.style.fontSize = '1.5rem';
bar.path.setAttribute('stroke-linecap', 'round');
bar.text.style.textAlign = 'center';

$('#container').on("mousewheel", increment);
$('#container').on("click", rst);

var u = 0;

function increment(){
		u += 1/nbSamples;
		bar.animate(u, {duration:300});  // Nu
}

function setProgressBarValue(newValue){
  u = newValue/nbSamples;
  bar.animate(u, {duration:300});  // Nu
}

function setProgressBarMax(max){
  nbSamples = max;
}

function rst(){
  u=0;	
  bar.animate(u, {duration:1000}); 
}

function resetWithoutAnimation(){
  u=0;	
  bar.set(0);
}
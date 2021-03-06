// Autosize 1.13 - jQuery plugin for textareas
// (c) 2012 Jack Moore - jacklmoore.com
// license: www.opensource.org/licenses/mit-license.php

(function($){var
defaults={className:'autosizejs',append:"",callback:false},hidden='hidden',borderBox='border-box',lineHeight='lineHeight',copy='<textarea tabindex="-1" style="position:absolute; top:-9999px; left:-9999px; right:auto; bottom:auto; -moz-box-sizing:content-box; -webkit-box-sizing:content-box; box-sizing:content-box; word-wrap:break-word; height:0 !important; min-height:0 !important; overflow:hidden;"/>',copyStyle=['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','textTransform','wordSpacing','textIndent'],oninput='oninput',onpropertychange='onpropertychange',test=$(copy)[0];test.setAttribute(oninput,"return");if($.isFunction(test[oninput])||onpropertychange in test){$(test).css(lineHeight,'99px');if($(test).css(lineHeight)==='99px'){copyStyle.push(lineHeight);}
$.fn.autosize=function(options){options=$.extend({},defaults,options||{});return this.each(function(){var
ta=this,$ta=$(ta),mirror,minHeight=$ta.height(),maxHeight=parseInt($ta.css('maxHeight'),10),active,i=copyStyle.length,resize,boxOffset=0,value=ta.value,callback=$.isFunction(options.callback);if($ta.css('box-sizing')===borderBox||$ta.css('-moz-box-sizing')===borderBox||$ta.css('-webkit-box-sizing')===borderBox){boxOffset=$ta.outerHeight()-$ta.height();}
if($ta.data('mirror')||$ta.data('ismirror')){return;}else{mirror=$(copy).data('ismirror',true).addClass(options.className)[0];resize=$ta.css('resize')==='none'?'none':'horizontal';$ta.data('mirror',$(mirror)).css({overflow:hidden,overflowY:hidden,wordWrap:'break-word',resize:resize});}
maxHeight=maxHeight&&maxHeight>0?maxHeight:9e4;function adjust(){var height,overflow,original;if(!active){active=true;mirror.value=ta.value+options.append;mirror.style.overflowY=ta.style.overflowY;original=parseInt(ta.style.height,10);mirror.style.width=$ta.css('width');mirror.scrollTop=0;mirror.scrollTop=9e4;height=mirror.scrollTop;overflow=hidden;if(height>maxHeight){height=maxHeight;overflow='scroll';}else if(height<minHeight){height=minHeight;}
height+=boxOffset;ta.style.overflowY=overflow;if(original!==height){ta.style.height=height+'px';if(callback){options.callback.call(ta);}}
setTimeout(function(){active=false;},1);}}
while(i--){mirror.style[copyStyle[i]]=$ta.css(copyStyle[i]);}
$('body').append(mirror);if(onpropertychange in ta){if(oninput in ta){ta[oninput]=ta.onkeyup=adjust;}else{ta[onpropertychange]=adjust;}}else{ta[oninput]=adjust;ta.value='';ta.value=value;}
$(window).resize(adjust);$ta.bind('autosize',adjust);adjust();});};}else{$.fn.autosize=function(callback){return this;};}}(Echo.jQuery));

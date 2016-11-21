var robots={};
var active='null'; // points to robots[selected] for functions and data
var r_names=[];
var i = 0;
function robot(nm,ip,control_port,cam_port)
{
	_instance=this; // for one time use only !!! use robots[active] later
	this._name=nm;
	this._ip=ip;
	this._control_port=control_port;
	this._cam_port=cam_port;
	this._api='null';
	this._val=30;
	this._mode='';
	this._log_data=function(data,fl){
		if(typeof(fl)==='undefined') fl=0
		if(fl)
		{
			_robot_console.append("<br><p style='color:red'>"+this._name+'- '+data+"</p>");
		}
		else
		{
			_robot_console.append("<br><p style='color:#80FF00'>"+this._name+'- '+data+"</p>");
		}
		eval(cmd);
		//alert(this._name+' '+data);
	}
	this._connect_to_api=function(){
		var _instance = this;
		this._log_data('connecting to robot\'s cylon api',0);
		this.D_status.html('connecting...');
		this._api=io('http://'+this._ip+':'+this._control_port+'/api/robots/nexus');
		this._api.on('_forward',function(data){_instance._log_data(data,1);});
		this._api.on('_left',function(data){_instance._log_data(data,1);});
		this._api.on('_stop',function(data){_instance._log_data(data,1);});
		this._api.on('_right',function(data){_instance._log_data(data,1);});
		this._api.on('_red_alert', function(data){_instance._log_data(data,1);_on_red_alert(data);});
		this._api.on('_log', function(data){_instance._log_data(data)});
		this._api.on('_show_image', function(data){_on_show_image(data);});
		this._api.on('connect_error', function(data){console.log('Connect error');_instance.D_status.html('Connect error');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-red');});
		this._api.on('reconnect_error', function(data){console.log('Rconnect error');_instance.D_status.html('Re-connect error');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-red');});
		this._api.on('reconnect_failed', function(data){console.log('Rconnect error');_instance.D_status.html('Disconnected');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-red');});
		this._api.on('connect', function(){_instance.D_status.html('Connected');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-green');});
		this._api.on('reconnect', function(){_instance.D_status.html('Re-connected');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-green');});
		this._api.on('reconnecting', function(data){_instance.D_status.html('Trying re-connect');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-red');});
		this._api.on('reconnect_attempt', function(){_instance.D_status.html('Trying re-connect');_instance.D_status_parent.removeClass('w3-green').removeClass('w3-red').addClass('w3-red');});
		//this.api=123;
	}
	this._start_self=function(){
		this._log_data('relay command to move forward');
		this._api.emit('forward');
	}
	this._stop_self=function(){
		this._log_data('relay command to stop');
		this._api.emit('stop');
	}
	this._identify_objects=function(){
		this._log_data('will identify objects now');
		this._api.emit('identify_objects'); //robot stopped now
		_instance = this;
		var prev_mode=_instance._mode;console.log(prev_mode);
		setTimeout(function(){
		$.ajax({url:'http://172.16.210.240:8050/home/'+_instance._ip+'/'+_instance._name}).done(function(data){
			data=data.trim();
			var res=data.split(',');
			console.log(res[0]);
			if(res[0]>0)
			{
				console.log(res[1]);
				$('#messages').append(_instance._name+' finished scene survey at '+Date()+". <a href='"+res[1]+"' target='blank'>Image stored here.</a><br>");
			}
		_instance._api.emit(prev_mode);});
		},1000);
	}
	this._turn_left=function(){
		this._log_data('relay command to turn left');
		this._api.emit('left');
	}
	this._turn_right=function(){
		this._log_data('relay command to turn right');
		this._api.emit('right');
	}
	this._switch_to_autonomous=function(){
		this._log_data('relay command to go autonomous');
		this._api.emit('autonomous');
	}
	this._change_velocity=function(val){
		this._log_data('changing robot\'s velocity '+val);
		this._api.emit('change_vel',val);
	}
	this._start_cam=function(){
		this._log_data('starting cam');
		$('#robot_cams').append("<div id="+this._cam_div+"><img width='640' height='480' src='http://"+this._ip+":"+this._cam_port+"/cam.mjpg' type='image/jpeg'></div>");
	}

	robots[this._name] = this; // can reference by name now !
	i = i+1;
	// update UIs now

	set_active_robot(this._name); // sets variable active to robots[this]
	update_UI(this._name)
}

function set_active_robot(nm)
{
	console.log(nm);
	active = nm;
	//r_names.push(nm);
}

function update_UI(nm)
{
	// update list of robots first in left pane
	// <div class="w3-container w3-red w3-padding w3-margin-top"><p class="w3-third w3-green">Robot2</p><p class="w3-twothird w3-padding w3-blue">Content<br>o this</p></div>
	_active_robots.append("<div class='w3-container w3-green w3-padding w3-margin-top w3-hover-black' style='cursor:pointer' onclick='update_selected(\""+nm+"\")' id='"+nm+"'><p class='w3-third'>Robot&nbsp;"+i+"</p><p class='w3-twothird'>Name:&nbsp;"+nm+"<br>IP:&nbsp;"+robots[nm]._ip+"</p></div>");
	// update status bar and set to normal
	r_names.push(nm);
	update_selected(nm);
	update_status(nm);
}

function update_selected(nm)
{
	_selected_robot.html("<h2>"+nm+"</h2>");
	set_active_robot(nm);
	_selected_robot.append("<br><button class='w3-btn w3-blue'>View Cam</button>&nbsp;&nbsp;<button class='w3-btn w3-blue'>Capture Shot</button>&nbsp;&nbsp;<button class='w3-btn w3-blue'>Analyse scene</button>");
}

function update_status(nm)
{
	_status_robots.append("<div class='w3-container w3-center w3-margin-top' id='status_parent_"+nm+"'><h6 class='w3-quarter'>"+nm+"</h6><h6 class='w3-twoquarter' id='status_"+nm+"'>Status displayed here</h6></div>");
	robots[nm].D_status = $("#status_"+nm);
	robots[nm].D_status_parent = $("#status_parent_"+nm);
	robots[nm].D_status_parent.addClass('w3-red');
}
function realsense(ip)
{
	var _t = this;
	this._ip = ip;
	this._aws = 'null';
	this._busy = 0;
	this._capture = function(){
		if(!this._busy)
		{
			_R_img.html("Please wait...");
			this._busy = 1;
			$.get('http://'+this._ip+':5000/capture', function(data){
				_R_img.html("Captured !");
				console.log(data);
				_t._busy = 0;
			});
		}
		else
		{
			alert('Busy capturing. Please wait...');
		}
	};
	this._color = function(){
		_R_img.html("loading color image...");
		_R_img.html("<img src='http://"+this._ip+":5000/color?t="+new Date().getTime()+"' style='height:100%'>");
	};
	this._infra = function(){
		_R_img.html("<img src='http://"+this._ip+":5000/infra?t="+new Date().getTime()+"' style='height:100%'>");
	};
	this._depth = function(){
		_R_img.html("<img src='http://"+this._ip+":5000/depth?t="+new Date().getTime()+"' style='height:100%'>");
	};
	this._compute = function(){
		$.get('http://'+this._ip+':5000/compute', function(data){
			console.log('uploaded to EC2');
			// data is the EC2 ip. Use this to compute stuff
			_t._aws = data;
			$.get("http://"+data+":8050/home/realsense", function(data){
				// data is now JSON of result
				data = JSON.parse(data);
				if(!_.isEmpty(data))
			        {
                			_sal.html("<p class='w3-red'>Loading ...</p>");
			                _show_image.html("<img src='http://"+_t._aws+":8050/get_res?t="+new Date().getTime()+"' style='width:100%'>");
                			var k = Object.keys(data);
                			_i_r.html("<h3>Found objects:</h3><br>");
                			for (var i = 0; i<k.length; i++)
                			{
                        			_i_r.append("<br><button class='w3-btn w3-teal' onclick=\"_m_s('"+k[i]+"','"+i+"')\">"+_.capitalize(k[i])+"</button><br>");
                			}
                			console.log(k);
                			_sal.html("<img src='http://"+_t._aws+":8050/sal?t="+new Date().getTime()+"' style='height:300px'>");
        			}
        			else
        			{
                			_i_r.html("No objects were identified in the scene.");
        			}
			})
		});
	}

	_R = this;
}

var Cylon = require('cylon');
var childProcess=require('child_process');
var MotorShield_lib = require('jsupm_adafruitms1438');
var es = require('exec-sync');
var http = require('http')
var _u = require('lodash');

var _aws = '52.192.0.144'
var aws_ip = 'http://'+_aws+':8050';

var _l_f = [];

var _nexus;
var _mode='manual';
var _action='null';
var _scan_in_progress=0;
var ip='172.17.33.247';
var speed=80; //default until changed by user  0-100
var _D = 1;
var _l_val=0;                                                         
var _r_val=0;                                                         
var _f_val=0;
var ult_control=0;
var ult_mode='null';

function exit(){
        console.log("Exiting");

        myMotorShield_obj = null;
        if (MotorShield_lib)
        {
                MotorShield_lib.cleanUp();
                MotorShield_lib = null;
        }
        process.exit(0);
}

var I2CBus = MotorShield_lib.ADAFRUITMS1438_I2C_BUS;
var I2CAddr = MotorShield_lib.ADAFRUITMS1438_DEFAULT_I2C_ADDR;

left_m = MotorShield_lib.AdafruitMS1438.MOTOR_M4;                                                                                                                                                                                             
right_m = MotorShield_lib.AdafruitMS1438.MOTOR_M3;                                                                                                                                                                                            
front_m = MotorShield_lib.AdafruitMS1438.MOTOR_M1;

MotorDirCW = MotorShield_lib.AdafruitMS1438.DIR_CCW;
MotorDirCCW = MotorShield_lib.AdafruitMS1438.DIR_CW;

myMotorShield_obj = new MotorShield_lib.AdafruitMS1438(I2CBus, I2CAddr);
myMotorShield_obj.setPWMPeriod(1600);
myMotorShield_obj.disableMotor(left_m);
myMotorShield_obj.disableMotor(right_m);
myMotorShield_obj.disableMotor(front_m);

function set_speed(lft,rgt,frnt){
var dir_lft = (lft >= 0) ? MotorDirCW : MotorDirCCW;
var dir_rgt = (rgt >= 0) ? MotorDirCW : MotorDirCCW;
var dir_frnt = (frnt >= 0) ? MotorDirCW : MotorDirCCW;
var spd_lft = Math.abs(lft);
var spd_rgt = Math.abs(rgt);
var spd_frnt = Math.abs(frnt);

myMotorShield_obj.setMotorSpeed(left_m,spd_lft);
myMotorShield_obj.setMotorDirection(left_m, dir_lft);

myMotorShield_obj.setMotorSpeed(right_m,spd_rgt);
myMotorShield_obj.setMotorDirection(right_m, dir_rgt);

myMotorShield_obj.setMotorSpeed(front_m,spd_frnt);
myMotorShield_obj.setMotorDirection(front_m, dir_frnt);

myMotorShield_obj.enableMotor(left_m);
myMotorShield_obj.enableMotor(right_m);                                  
myMotorShield_obj.enableMotor(front_m);                                  
}

function stop(){                       
myMotorShield_obj.disableMotor(left_m);    
myMotorShield_obj.disableMotor(right_m);                 
myMotorShield_obj.disableMotor(front_m);
}

Cylon.robot({
name: 'nexus',
events:['_show_image', '_left','left','_right','right','_start','_stop','_forward','forward','_vel', '_log'],

connections: {
   edison: { adaptor: 'intel-iot'},
},

devices: {
	f_sensor: {driver:'maxbotix', pin: 1},
	l_sensor: {driver:'maxbotix', pin: 0},
	r_sensor: {driver:'maxbotix', pin: 2}
},

work: function(instance) {
	console.log('Welcome to nexus leader!');
	_nexus=instance;
	_nexus.wait_for_start();
},
wait_for_start:function(){
	console.log('Waiting for user to start me...');
	//_nexus.start_ranging();
	//_nexus.forward();
},
start_ranging: function(){
	every((0.2).seconds(), function(){
		var _l_val=0;
		var _r_val=0;
		var _f_val=0;
		_nexus.f_sensor.range(function(err,data){
			//console.log("\n\n------\n\nsensor front: "+data);
			_f_val=data;
		});
                _nexus.l_sensor.range(function(err,data){
                        //console.log("sensor left: "+data);
			_l_val=data;
                });
                _nexus.r_sensor.range(function(err,data){
                        //console.log("sensor right: "+data);
			_r_val=data;
                });
		if(_f_val<=8 || ult_mode=='forward') //obstacle in front, stop, rotate till all values stabilize
		{
			if(_mode=='forward')
			{
				ult_mode='forward';
				if(!ult_control)
				{
					ult_control=1;
					console.log('There is an obstacle in front of me !\n changing trajectory');
					set_speed(0,0,0);
					if(_r_val>=20) //where to turn ?
					{
						set_speed(-1*speed,-1*speed,-1*speed); //turn_right
						console.log('ult control turning right');
						after((1).seconds(), function(){ ult_control=0;ult_mode='null';eval("_nexus."+_mode+"('f');"); });
					} else if(_l_val>=20)
					{
						set_speed(speed,speed,speed); //turn left
						after((1).seconds(), function(){ ult_control=0;ult_mode='null';eval("_nexus."+_mode+"('f');"); });
						console.log('ult control turning left');
					} else
					{
						set_speed(-1*speed,-1*speed,-1*speed); //turn right anyways :-/
						after((1).seconds(), function(){ ult_control=0;ult_mode='null';eval("_nexus."+_mode+"('f');"); });
						console.log('ult control turning right anyways...');
					}
				}
			}
		} else if(_l_val<=8 || ult_mode=='left') //obstacle on left and not being controlled by forward ult mode or right
		{
			if(_mode=='forward')
			{
				ult_mode='left';
				if(!ult_control)
				{
					ult_control=1;
					console.log('There is an obstacle on my left !\n changing trajectory');
					set_speed(-1*20,20,+1*30);
					after((2).seconds(), function(){ ult_control=0;ult_mode='null';eval("_nexus."+_mode+"('f');"); });
				}
			}
		} else if(_r_val<=8 || ult_mode=='right') //obstacle on right
		{
                        if(_mode=='forward')                                                                                                                                                                                                  
                        {                                                                                                                                                                                                                     
                                ult_mode='right';                                                                                                                                                                                              
                                if(!ult_control)                                                                                                                                                                                              
                                {                                                                                                                                                                                                             
                                        ult_control=1;                                                                                                                                                                                        
                                        console.log('There is an obstacle on my right !\n changing trajectory');                                                                                                                               
                                        set_speed(-1*20,20,-1*30);                                                                                                                                                                            
                                        after((2).seconds(), function(){ ult_control=0;ult_mode='null';eval("_nexus."+_mode+"('f');"); });                                                                                                    
                                }                                                                                                                                                                                                             
                        }
		}
	});
},
forward: function(force){
	if(_mode!='forward' || force=='f'){
		console.log('moving forward now');
		set_speed(0,0,0); // stop whatever the robot is doing
		set_speed(-1*speed,speed,0);
		_mode='forward';
		_nexus.emit('_forward','moving forward');
	}
	else{
		_nexus.emit('_forward','already moving forward');
	}
},
left: function(force){
	if(_mode!='left' || force=='f'){
		console.log('turning left around center axis');
		set_speed(0,0,0);
		set_speed(speed,speed,speed);
		_mode='left';
		_nexus.emit('_left','turning left');
	}
	else{
		_nexus.emit('_left','already turning left');
	}
},
right: function(force){
        if(_mode!='right' || force=='f'){   
                console.log('turning right around center axis');
                set_speed(0,0,0);
                set_speed(-1*speed,-1*speed,-1*speed);    
                _mode='right'; 
                _nexus.emit('_right','turning right');
        }
        else{                     
                _nexus.emit('_right','already turning right');
        }
},
change_vel: function(vel){
	console.log('changing vel in mode '+_mode);
	speed=vel;
	if(_mode==="right"){_mode="";_nexus.right();}
	else if(_mode==="left"){_mode="";_nexus.left();}
	else if(_mode==="forward"){_mode="";_nexus.forward();}
	else if(_mode==="stop"){_mode="";_nexus.forward;}
	//_mode='';
	//_nexus.left();
	_nexus.emit('_vel','vel is now '+speed);
},
stop: function(force){
	console.log('stopping robot');
	set_speed(0,0,0);
	_mode='stop';
	_nexus.emit('_stop','stopped');
},                                                                                                        
identify_objects: function(){                                                                             
        _nexus.stop();
	console.log('starting image capture');
	_nexus.emit('_log','starting image capture');
	try{
		es('fswebcam -r 1280x960 --jpeg 85 -D '+_D+' shot.jpg');
		//es('fswebcam -r 640x480 --jpeg 85 -D 1 shot.jpg');
	} catch(e){}
	console.log('image saved... sending it to ec2 for analysis');
	_nexus.emit('_log','image saved... sending it to ec2 for analysis');
	try{
		es('scp -i "g2large.pem" shot.jpg ubuntu@'+_aws+':/home/ubuntu/${HOSTNAME}/.');
	} catch(e) {}
	console.log('uploaded !');
	_nexus.emit('_log','uploaded !');
	_nexus.emit('_log','performing analysis, please wait...')
	console.log('performing analysis, please wait...');
	http.get(aws_ip+'/home/follower', function(r){
		console.log(r.statusCode);
		var body = '';
		r.on('data', function(e){body += e;});
		r.on('end', function(){
			console.log('Obtained data !');
			_nexus.emit('_log','Obtained data !');
			var _tmp = {'url': aws_ip+'/get_res', 'cat': JSON.parse(body)};
			_nexus.emit('_show_image',_tmp)
			console.log(JSON.parse(body));
		})
	});
},
_make_susp: function(obj){
        console.log(obj+' is now a suspicious object. Find and kill :-)');
	_l_f.push(obj);
	console.log(_l_f);
},
_umake_susp: function(obj){
        console.log(obj+' will be spared ;-)');
	_l_f.splice(_l_f.indexOf(obj),1); // removed
        console.log(_l_f);
}
});

process.on('SIGINT', function()        
{                                          
        exit();                                          
});

childProcess.exec('configure_edison --showWiFiIP',function(a,b,c){

Cylon.api(                                          
  'socketio', 
  {                              
  host: b.trim(),                                         
  port: '1337'                                      
});                                                   
                            
Cylon.start();

});


/*Cylon.api(
  'socketio',
  {
  host: ip,
  port: '1337'
});

Cylon.start();*/

/*		React		*/
import React from 'react';
import { Component } from 'react';

/*		Styles		*/
import './style.css';
import 'rc-datepicker/lib/style.css';

/*		Sweetalert		*/
import swal from 'sweetalert';

/*		Font awesome		*/
import 'font-awesome/css/font-awesome.min.css'

/*		React select		*/
import Select from 'react-select';

/*		React date picker		*/
import 'moment/locale/ru.js';
import { DatePicker, DatePickerInput } from 'rc-datepicker';

/*		Soket.io		*/
import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';


const socket = io.connect("http://127.0.0.1:8080");


function getTimeString(time) {
	let date = time ? new Date(time) : new Date(),
		day = date.getDate(),
		month = date.getMonth() + 1,
		year = date.getFullYear(),
		hours = date.getHours(),
		minutes = date.getMinutes();
	
	return (day < 10 ? '0' : '') + day + '.' + (month < 10 ? '0' : '') + month + '.' + (year < 10 ? '0' : '') + year + ' ' + (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
}

function getDateString(dateString) {
	console.log('dateString', dateString)
	let date = dateString ? new Date(dateString) : new Date(),
		day = date.getDate(),
		month = date.getMonth() + 1,
		year = date.getFullYear();

	return  (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day + '-' + (year < 10 ? '0' : '') + year;
}


/*		COMMMON		*/
class Time extends Component {
	constructor () {
		super();

		this.state = {
			time: getTimeString()
		};

		setInterval(() => {
			this.setState({ time: getTimeString() })
		}, 1000);
	}


	render() {
		return (
			<div className="Time">{ this.state.time }</div>
		);
	}
}

class Btn extends Component {
	render() {
		let className = 'Btn Box ' + (this.props.classname ? this.props.classname : '');

		let nextMode, btnText, id = '';

		switch (this.props.mode)
		{
			case 'Cars':
				nextMode = 'History';
				btnText = 'Отчеты'
				break;
			case 'History':
				nextMode = 'Cars';
				btnText = 'На главную';
				break;
			default:
				id = 'btnClear';
				btnText = 'Очистить'
		}

		return (
			<button id={id} className={className} onClick={() => this.props.onBtnClicked(nextMode)} >
				{btnText}
			</button>
		);
	}
}

class FirstContainerFlex  extends Component {
	render() {
		let cancelClassName = this.props.showCancel ? '' : 'Hidden';
		let classname = 'ContainerFlex flex';

		return (
			this.props.mode == 'Cars'
				? 
					<div className={classname}>
						<Btn mode={this.props.mode} onBtnClicked={this.props.onBtnClicked}/>
						<Time />
						<Btn classname={cancelClassName} className={cancelClassName} onBtnClicked={() => { this.props.onUserSelected(-1);}}/>
					</div>
				:
					<div className={classname}>
						<Btn mode={this.props.mode} onBtnClicked={this.props.onBtnClicked}/>
						<Time />
						<Btn classname={cancelClassName} className={cancelClassName} />
					</div>
		);
	}
}

/*		CARS VIEW		*/
class SelectEmployee extends Component {
	constructor () {
		super();
	}

	render() {
		let users = this.props.users.map(item => {
			return { value: item.id, label: item.name }
		});

		return (
			<div className="SelectEmployee" id="Select"><Select name="form-field-name" value={this.props.selectedUser} onChange={this.props.onUserSelected} options={users} /></div>
		);
	}
}

class EmployeeContainerFlex extends Component {
	constructor () {
		super();     
	}

	render() {
		let user = this.props.users.filter(item => item.id == this.props.selectedUser);

		if(user && user.length) {
			user = user[0];
		}
		else {
			user = null;
		}

		return (
			<div className="EmployeeContainerFlex">
				{user ?
					<div className="ContainerFlex">
						<div className="userImage">
							<img src="image/user.svg" />
						</div>
						<div className="userTitle">
							<div className="userName">{user.name}</div>
							<div className="userPost">{user.post}</div>
						</div>
					</div>
					:
					<div className="NotSelected">Сотрудник не выбран</div>
				}
			</div>
		);
	}
} 

class Car extends Component {
	constructor() {
		super();
		this.getStatus = this.getStatus.bind(this);

		this.state = {
			isSelected: false
		};

		this.onMouseOver = this.onMouseOver.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onTakeClicked = this.onTakeClicked.bind(this);
		this.onCancelClicked = this.onCancelClicked.bind(this);
	}

	getStatus(statusNumber) {
		switch (statusNumber)
		{
			case 0:
				return 'На парковке';
			case 1:
				return 'Занят';
			case 2:
				return 'Зарезервирован';
			case 3:
				return 'Отсутствует';
		}
	}

	onMouseOver() {
		this.setState({isSelected: true});
	}

	onMouseLeave() {
		this.setState({isSelected: false});
	}

	onTakeClicked(car, userId, updateCars) {
		if (userId == -1)
		{
			swal({
				title: "Ошибка!",
				text: "Сотрудник не выбран",
				icon: "warning",
				button: "OK",
			});

			return;
		}

		var content = document.createElement("div");
		content.innerHTML= '<div class="swal-title reg_number">' + car.reg_number + '</div>' + 'Хотите выбрать эту машину в поездку?';

		swal({
		  html: true,
		  title: car.brand + ' ' + car.model,
		  content: content,
		  icon: "info",
		  buttons: ["Отмена", "Да"],
		  dangerMode: true,
		})
		.then((result) => {
		  if (result) {
		    fetch('/car/lock/' + car.id + '/' + userId)
			.then(out => out.json())
			.then(out => {
				if(!out.status && out.value) {
				  	swal({
						title: "Успешно!",
						icon: "success",
						button: "OK",
					});
					updateCars(userId);
				}
				else {
					swal({
						title: "Ошибка!",
						text: "Вы не можете выбрать этот автомобиль",
						icon: "warning",
						button: "OK",
					});
				}
			});
		  } 
		});
	}

	onCancelClicked(car, userId, updateCars) {
		swal({
			title: 'Внимание',
			text: "Отменить поездку?",
			icon: "info",
			buttons: ["Нет", "Да"],
			dangerMode: true
		})
		.then((result) => {
			if (result) {
				fetch('/car/cancel/' + car.id)
				.then(out => out.json())
				.then(out => {
					if(!out.status && out.value) {
						swal({
							title: "Успешно!",
							icon: "success",
							button: "OK",
						});
						updateCars(userId);
					}
					else {
						swal({
							title: "Ошибка!",
							icon: "warning",
							button: "OK",
						});
					}
				});
			}
		});
	}

	render () {
		let carStatus = 'carStatus ' + (this.props.car.status == 0 ? 'available' : ''),
			style = {
				background: 'url("image/' + this.props.car.brand.replace(' ', '_') + '_' + this.props.car.model.replace(' ', '_') + '.png")'
			};

		let user = (this.props.users ? this.props.users.filter(u => this.props.car.active_user_id == u.id) : null);

		if (user && user.length){
			user = user[0];
		}
		else {
			user = null;
		}
		let classname = 'Car' + (this.state.isSelected ? ' selected' : '');
		return ( <div className={classname} onMouseOver={this.onMouseOver} onMouseLeave={this.onMouseLeave}>
					<div>{this.props.car.brand}</div>
					<div>{this.props.car.model}</div>
					<div className="regNumber">{this.props.car.reg_number}</div>
					<div className="carImage" style={style} ></div>
					<div className="carInfo">
						{(this.state.isSelected && this.props.car.status == 0  ?
							<div className="carButtons">
								<button className='button available Box' onClick={() => this.onTakeClicked(this.props.car, this.props.selectedUser, this.props.updateCars)}>Поездка</button>
								<button className='button disabled Box'>Забронировать</button>
							</div>
							:
							(this.props.car.status == 0 ?
								<div className={carStatus}>{this.getStatus(this.props.car.status)}</div>
								:
								this.state.isSelected && this.props.car.active_user_id == this.props.selectedUser && this.props.car.status != 3 ? 
									<div className="carButtons">
										<button className='button cancel Box' onClick={() => this.onCancelClicked(this.props.car, this.props.selectedUser, this.props.updateCars)}>Отмена</button>
									</div>
									:
									<div>
										<div className={carStatus}>{this.getStatus(this.props.car.status)}</div>
										<div className="userInfo">
											<div>{(user ? user.name : '')}</div>
											<div>{(user && this.props.car.status == 3 ? getTimeString(this.props.car.time_out) : '-')} </div>
										</div>
									</div>
							)
						)}
					</div>
				 </div>);
	}
}

class Cars extends Component {
	constructor() {
		super();

		this.state = {
			showCarsMode: 'all'
		}

		this.options = {
			blocks: {
				width: 270,
				gap: 20
			}
		}

		this.resizeCarsBlock = this.resizeCarsBlock.bind(this);

		window.addEventListener('resize', () => this.resizeCarsBlock());
	}

	resizeCarsBlock () {
		let container = document.getElementsByClassName('carsContainer');

		for(let i=0; i<container.length; i++) {
			let blocksPerRow = Math.floor(container[i].clientWidth / (this.options.blocks.width + this.options.blocks.gap));
			let blocksSpace = ((container[i].clientWidth - (blocksPerRow * this.options.blocks.width)) / (blocksPerRow - 1));
			
			for(let j=0; j<container[i].children.length; j++) {
				if(j % blocksPerRow == blocksPerRow - 1) {
					container[i].children[j].style['margin-left'] = (blocksSpace - 3) + 'px';
				}
				else if(j % blocksPerRow) {
					container[i].children[j].style['margin-left'] = (blocksSpace) + 'px';
				}
				else {
					container[i].children[j].style['margin-left'] = '0px';
				}

			}
		}
	}

	componentDidUpdate () {
		this.resizeCarsBlock();
	}

	componentDidMount () {
		this.resizeCarsBlock();
	}

	render () {
		let userId = this.props.selectedUserl
		let carsRow = [];

		let activeCar = this.props.cars.filter(item => item.status != 0 && item.active_user_id == this.props.selectedUser);

		if (activeCar && activeCar.length) {
			activeCar = activeCar[0];
		}
		else {
			activeCar = null;
		}

		let availableCount = this.props.cars.filter(item => item.status == 0);

		if (availableCount && availableCount.length) {
			availableCount = availableCount.length;
		}
		else {
			availableCount = 0;
		}

		let disabledCount = this.props.cars.filter(item => item.status != 0 && (!activeCar || item.id != activeCar.id));
		
		if (disabledCount && disabledCount.length) {
			disabledCount = disabledCount.length;
		}
		else {
			disabledCount = 0;
		}

		return (
			<div>
				<div className="radio">
					<div className="text"> Отображать: </div>
					<div className="buttons">
						<button className={'Btn Box ' + ( this.state.showCarsMode == 'all' ? 'active' : '')} onClick={() => { this.setState({ showCarsMode: 'all' }); }}>Все машины</button>
						<button className={'Btn Box ' + ( this.state.showCarsMode == 'onlyAvailable' ? 'active' : '')} onClick={() => { this.setState({ showCarsMode: 'onlyAvailable' }); }}>Только свободные</button>
						<button className={'Btn Box ' + ( this.state.showCarsMode == 'onlyUnavailable' ? 'active' : '')} onClick={() => { this.setState({ showCarsMode: 'onlyUnavailable' }); }}>Только занятые</button>
					</div>
				</div>
				{
					activeCar ?
					<p className="statusTitle blue">Текущий</p>
					:
					<div></div>
				}
				{
					activeCar ?
					<div className="carsContainer">
						{	
							<Car car={activeCar} users={this.props.users} selectedUser={this.props.selectedUser} updateCars={this.props.updateCars}/>
						}
					</div>
					:
					<div></div>
				}

				{
					this.state.showCarsMode == 'all' || this.state.showCarsMode == 'onlyAvailable' && availableCount != 0 ?
					<p className="statusTitle green">Свободны</p>
					:
					<div></div>
				}
				{
					this.state.showCarsMode == 'all' || this.state.showCarsMode == 'onlyAvailable' && availableCount != 0 ?
					<div className="carsContainer">
						{	
							this.props.cars.map((item, i) => {
								if (item.status == 0) {
									return <Car key={i} car={item} users={this.props.users} selectedUser={this.props.selectedUser} updateCars={this.props.updateCars}/>
								}
							})
						}
					</div>
					:
					<div></div>
				}

				{
					this.state.showCarsMode == 'all' || this.state.showCarsMode == 'onlyUnavailable' && disabledCount != 0 ?
					<p className="statusTitle gray">Заняты</p>
					:
					<div></div>
				}
				{
					this.state.showCarsMode == 'all' || this.state.showCarsMode == 'onlyUnavailable' && disabledCount != 0 ?
					<div className="carsContainer">
					{	
						this.props.cars.map((item, i) => {
							if (item.status != 0 && (!activeCar || item.id != activeCar.id)) {
								return <Car key={i} car={item} users={this.props.users} selectedUser={this.props.selectedUser} updateCars={this.props.updateCars}/>
							}
						})
					}
					</div>
					:
					<div></div>
				}
			</div>
		);
	}
}


/*		HISTORY VIEW		*/
class DatePickers extends Component {
	constructor() {
		super();
		this.onDateFromChanged = this.onDateFromChanged.bind(this);
		this.onDateToChanged = this.onDateToChanged.bind(this);
	}

	onDateFromChanged(jsDate) {
		this.props.onDateFromChanged(jsDate);
	}

	onDateToChanged(jsDate) {
		this.props.onDateToChanged(jsDate);
	}

	render() {
		console.log('RENDER');
		let dateFrom = getDateString(this.props.dateFrom);
		let dateTo = getDateString(this.props.dateTo);
		return ( 
			<div className="DatePickers">
		    	<DatePickerInput onChange={this.onDateFromChanged} showOnInputClick={true} value={dateFrom} className='my-custom-datepicker-component' />
		    	<DatePickerInput onChange={this.onDateToChanged} showOnInputClick={true} value={dateTo} className='my-custom-datepicker-component' />
			</div>
			);
	}
}

class HistoryTable extends Component {
	constructor() {
		super();
		let dateNow = new Date();
		let dateFrom = new Date(new Date(dateNow).setMonth(dateNow.getMonth() - 1));
		this.state = {
			rowsPerPage: 12,
			history: [],
			historyLength: 0,
			currentPage: 0,
			cars: [],
			dateFrom: dateFrom,
			dateTo: dateNow
		};

		this.updatePage = this.updatePage.bind(this);
		this.updateDateFrom = this.updateDateFrom.bind(this);
		this.updateDateTo = this.updateDateTo.bind(this);
		this.updateTable = this.updateTable.bind(this);
	}

	 componentWillMount () {
	 	fetch('/car')
		.then(out => out.json())
		.then(out => {
			if(!out.status) {
				this.setState({ cars: out.value });
			}
		})
		.then(() => {
			this.updateTable(this.state.dateFrom, this.state.dateTo);
		})
	}

	updateTable(from, to) {
		let dateFrom = from ? from : this.state.dateFrom;
		let dateTo = to ? to : this.state.dateTo;
		let historyLength = 0;
		fetch('/history/date/count/' + dateFrom.getTime() + '/' + dateTo.getTime())
		.then(out => out.json())
		.then(out => {
			if(!out.status && out.value && out.value.length) {
				historyLength = out.value[0].count;
				this.updatePage(0, historyLength, dateFrom, dateTo)
			}
		})
	}

	updatePage(page, historyLength,  dateFrom, dateTo) {
		dateFrom = dateFrom ? dateFrom : this.state.dateFrom;
		dateTo = dateTo ? dateTo : this.state.dateTo;
		
		if (!page)
			page = 0;
        let from = this.state.rowsPerPage * page;
		fetch('/history/date/' + dateFrom.getTime() + '/' + dateTo.getTime() + '?limit_from=' + from + '&limit_count=' + this.state.rowsPerPage)
		.then(out => out.json())
		.then(out => {
			if(!out.status) {
				console.log('arr', out.value)
				this.setState({ history: out.value, 
								currentPage: page, 
								historyLength: historyLength === undefined ? this.state.historyLength : historyLength, 
								dateFrom: dateFrom,
								dateTo: dateTo});
			}
		})
	}

	updateDateFrom(dateFrom){
		dateFrom.setHours(0);
		dateFrom.setMinutes(0);
		this.updateTable(dateFrom, this.state.dateTo);
	}

	updateDateTo(dateTo){
		dateTo.setHours(23);
		dateTo.setMinutes(59);
		this.updateTable(this.state.dateFrom, dateTo);
	}

	render() {
		let arr = this.state.history;

		  if (!this.state.currentPage) {
            this.state.currentPage = 0;
        }

        let pages_count = Math.ceil(this.state.historyLength / this.state.rowsPerPage);
       	var pagesRows = []
       	for(let i = 2; pages_count > i; i++) {
			if (i - this.state.currentPage >= 0 && 3 > i - this.state.currentPage)
				pagesRows.push(<a onClick={() => this.updatePage(i - 1)} className={i == this.state.currentPage + 1 ? ' active' : ''}>{i}</a>)
		}
		return (
				<div>
					<DatePickers onDateFromChanged={this.updateDateFrom} onDateToChanged={this.updateDateTo} dateFrom={this.state.dateFrom} dateTo={this.state.dateTo}/>
						{
							this.state.historyLength > 0 ? 
							<div>
								<table className="historyTable"  cellSpacing="0">
									<tr className="head">
										<th>№</th>
										<th>Сотрудник</th>
										<th>Должность</th>
										<th>Автомобиль</th>
										<th>Время выезда</th>
										<th>Время приезда</th>
									</tr>
									{
										this.state.history.map((item, i) => {
											let user = this.props.users.filter(u => parseInt(u.id) == parseInt(item.user_id));
											user = user && user.length ? user[0] : {};
											let car = this.state.cars.filter(c => parseInt(c.id) == parseInt(item.car_id));
											car = car &&car.length ? car[0] : {};
											return (
												<tr key={i}>
													<td><div className="columnName">№</div><div>{item.id}</div></td>
													<td><div className="columnName">Сотрудник</div><div>{user.name}</div></td>
													<td><div className="columnName">Должность</div><div>{user.post}</div></td>
													<td><div className="columnName">Атомобиль</div><div>{car.brand + ' '+ car.model + ' ' + car.reg_number}</div></td>
													<td><div className="columnName">Время выезда</div><div>{getTimeString(item.time_out)}</div></td>
													<td><div className="columnName">Время приезда</div><div>{getTimeString(item.time_in)}</div></td>
													<tr><div></div></tr>
												</tr>
											)
										})
									}
								</table>
								{
									this.state.historyLength >= this.state.rowsPerPage ?
										<div className="pag">
											<div className="pagination">
											{ this.state.currentPage > 0 ?
												<div className="goto">
													<a onClick={() => this.updatePage(this.state.currentPage - 1)}><i className="fa fa-chevron-left" aria-hidden="true"></i></a>
												</div>
												:
												<div></div>
											}
											<div className="pages">
												<a onClick={() => this.updatePage(0)} className={this.state.currentPage == 0 ? ' active': ''}>1</a>
												{ 0 > 2 - this.state.currentPage ? 
													<a className="fill">...</a>
													:
													<div></div>
												}
												{pagesRows}
												{ pages_count - this.state.currentPage > 3 ?
													<a className="fill">...</a>
													:
													<div></div>
												}
												<a onClick={() => this.updatePage(pages_count - 1)} className={this.state.currentPage == pages_count - 1 ? ' active' : ''}>{pages_count}</a>
											</div>
											{ pages_count - 1 > this.state.currentPage ?
												<div className="goto">
													<a onClick={() => this.updatePage(this.state.currentPage + 1)}><i className="fa fa-chevron-right" aria-hidden="true"></i></a>
												</div>	
												:
												<div></div>
											}
											</div>
										</div>
										:
										<div></div>
									}
								</div>
							:
							<div className="NotSelected">Результатов не найдено</div>
						}

                </div>
		);
	}
}


/*		HOME		*/
class Home extends Component {
	constructor () {
		super();

		this.state = {
			selectedUser: -1,
			users: [],
			cars: [],
			mode: 'Cars'
		};

		this.onUserSelected = this.onUserSelected.bind(this);
		this.updateCars = this.updateCars.bind(this);
		this.onBtnClicked = this.onBtnClicked.bind(this);
		this.onCarIn = this.onCarIn.bind(this);
		this.onCarOut = this.onCarOut.bind(this);

		socket.on('car.in', (data) => {
			this.onCarIn(data);
		});

		socket.on('car.out', (data) => {
			this.onCarOut(data);
		});

		socket.on('car.reservation', (data) => {
			fetch('/car')
			.then(out => out.json())
			.then(out => {
				this.setState({ cars: out.value })
			});
		});

	}

	 componentWillMount () {
		fetch('/user')
		.then(out => out.json())
		.then(out => {
			if(!out.status) {
				this.setState({ users: out.value });
			}
		})
		.then(() => {
			this.updateCars(-1);
		});
	}

	updateCars(userId) {
		fetch('/car')
		.then(out => out.json())
		.then(out => {
			if(!out.status) {
				if (!userId || userId == -1) {
					this.setState({ cars: out.value, selectedUser: -1 });
				}
				else {
					let cars = out.value;
					let user = this.state.users.filter(u => u.id == userId);
					if (user && user.length) {
						user = user[0];
						let userCars = user.cars.split(',');
						cars = cars ? cars.filter(car => { let arr = userCars.filter(str => str == car.id.toString()); return arr && arr.length; }) : [];
					}

					this.setState({ cars: cars, selectedUser: userId });
				}
			}
		});
	}

	onCarIn(data) {
		let carId = data.car;
		let cars = this.state.cars;
		let car = cars.filter(c => c.id == carId);
		if (car && car.length) {
			car = car[0];
			car.status = 0;
			car.user_id = 0;
		}

		this.setState({ cars: cars});
	}

	onCarOut(data) {
		let carId = data.car;
		let cars = this.state.cars;
		let car = cars.filter(c => c.id == carId);
		if (car && car.length) {
			car = car[0];
			car.status = 3;
			car.active_user_id = data.user;
			car.time_out = data.time_out;
		}

		this.setState({ cars: cars});
	}

	onBtnClicked(mode) {
		this.setState({
			selectedUser: -1,
			mode: mode
		});
	}

	onUserSelected(user) {
		this.updateCars(user ? user.value : -1);
	}

	render() {
		let mode = this.state.mode;
		let showCancel = this.state.selectedUser != -1;

		return (
			mode == 'Cars' ?
				<div className="Home">
					<FirstContainerFlex showCancel={showCancel} mode={this.state.mode} onBtnClicked={this.onBtnClicked} onUserSelected={this.onUserSelected}/>
					<SelectEmployee onUserSelected={this.onUserSelected} users={this.state.users} selectedUser={this.state.selectedUser} />
					<EmployeeContainerFlex users={this.state.users} selectedUser={this.state.selectedUser} />
					<Cars cars={this.state.cars} selectedUser={this.state.selectedUser} users={this.state.users} updateCars={this.updateCars}/>
				</div>
				:
				<div className="Home">
					<FirstContainerFlex mode={this.state.mode} onBtnClicked={this.onBtnClicked}  showCancel={false} />

					<HistoryTable users={this.state.users} />
				</div>
		);
	}
}

export default Home;

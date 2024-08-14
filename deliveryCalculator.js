const rules = {
    cariers: {
        borok: {
            on: true,
            coord:'Новосибирск, ул. Большевистская, 270',
            options: {
                showHeader: true,
                title: 'Адрес доставки',
                visible: false,
                rount: true,
                types: {auto: true},
            },
        },
        marusino: {
            on: true,
            coord:'55.031814, 82.776205',
            options: {
                types: {auto: true},
                visible: false,
                showHeader: true,
                rount: false,
                title: 'Карьер Марусино',
            },
        },
        krivodanovskiy: {
            on: true,
            coord:'55.103921, 82.587341',
            options: {
                types: {auto: true},
                visible: false,
                showHeader: true,
                rount: false,
                title: 'Криводановский карьер',
            },
        },
        kudrjashovskiy: {
            on: true,
            coord:'55.093488, 82.674170',
            options: {
                types: { auto: true},
                visible: false,
                rount: true,
                showHeader: true,
                title: 'Карьер Кудряшовский',
            },
        }
    },
    zoomControl: {
        options: {
            size: 'small',
            float: 'none',
            position: {
                bottom: 30,
                right: 10
            }
        }
    },

    nameLocation: ['рабочий посёлок Коченёво','Новосибирск', 'рабочий посёлок Чик', 'Россия, Новосибирск, Калининский район'],
    coordinatesException: {
        coordinates: [
            ['Россия, Новосибирск, СНТ Сибирский Мичуринец','Первомайский район']
        ],
        street: [
            ['аэропорт Новосибирск (Толмачёво) имени А.И. Покрышкина', 'Обь'], ['Новосибирск садоводческое некоммерческое товарищество Береговое ','Первомайский район']
        ],

        polygon: [
            ['коттеджный посёлок Сигма', '1711']
        ]
    }

}

$(document).ready(function() {
    window.coordinates = '';
    window.polygon_id = 0;

    let url = window.location.href;
    let urlAjax = url.includes('order') ? '/order/map/ajax.php' : '/price/delivery/ajax.php';
    let page = url.includes('order') ? 'order' : 'delivery';
   
    function getCoordinates(){
        let object = $.ajax({
            type: 'POST',
            url: urlAjax,
            async: false,
            data: {'get_coordinates': 1},
        }).responseText;
        if(page === 'delivery') {
            object = JSON.parse(object);

            for (const key in object) {
                if (Object.hasOwnProperty.call(object, key)) {
                    object[key] = JSON.parse(object[key]);
                    object[key]['COORDS'] = JSON.parse(object[key]['COORDS']);
                };
            };
        };
        return object;
    }

    var coorddd = getCoordinates();
    var myMap;

    ymaps.ready(init);

    function init() {
        myMap = new ymaps.Map('map', {
            center: [55.030199, 82.920430],
            zoom:12,
            controls: []
        });

        let myYmapsBounds = [[57.358724, 74.986174], [53.381904, 85.336443]];//координаты границы поиска

        // Circle //
        let style = `
            background-color: #fcc842;
            position: absolute;
            left: -23px;
            top: -23px;
            width: 26px;
            height: 26px;
            border: 3px solid rgb(76 93 104);
            color: #225D9C;
            line-height: 46px;
            /* Это CSS свойство не будет работать в Internet Explorer 8 */
            border-radius: 50px;
        `;

        if (page === 'delivery')  {
            var circleLayout = ymaps.templateLayoutFactory.createClass(`<div class="placemark_layout_container"><div style='${style}'></div></div>`);
            [
                [54.907384, 82.97703], [54.993900, 82.704258], [55.094251, 82.602223], [55.144313, 82.898819],
                [55.061973, 83.195277], [54.967177, 83.317164], [55.365741, 82.763717], [54.352111, 81.808426],
                [55.284289, 76.807047], [54.596115, 83.136412], [55.406179, 78.330375], [55.166222, 80.282177]
            ].forEach(item => {
                myMap.geoObjects.add(
                    new ymaps.Placemark([
                        item[0],
                        item[1]
                    ], {}, {
                        iconLayout: circleLayout,
                        // Описываем фигуру активной области "Круг".
                        iconShape: {
                            type: 'Circle',
                            // Круг описывается в виде центра и радиуса
                            coordinates: [0, 0],
                            radius: 25
                        }
                    })
                );
            });
        }

        if(page === 'order') coorddd = JSON.parse(coorddd);

        $.each(coorddd, function (ix, coordinates_r) {
            if (typeof coordinates_r.COORDS[1] !== "undefined") {
                $.each(coordinates_r.COORDS, function (ixx, item) {
                    myMap.geoObjects.add(addGeo(ix,item, coordinates_r.COLOR));
                });
            } else {//Если один полигон
                p = addGeo(ix,coordinates_r.COORDS, coordinates_r.COLOR);
                myMap.geoObjects.add(p);
            }
        });

        myMap.geoObjects.events.add('click', function (e) { //Клик по полигону
            var coords = e.get('coords');
            var object = e.get('target');

            window.polygon_id = object.properties._data.polygon_id; //ID элемента инфоблока координаты, цены

            [routePanelControl, routePanelControl2, routePanelControl3].forEach(item => {
                item.routePanel.state.set({//переделать
                    fromEnabled: false,
                    to: coords
                });
            });
            window.routePanelControl3=routePanelControl3;
        });

        myMap.events.add('click', function (e) {
            window.polygon_id = 0;
        });

        function addGeo(ix,coordinates, color){
            if (color == "undefined" || color == null) color = '#fdc842';
            var p = new ymaps.GeoObject({
                geometry: {
                    type: "Polygon",
                    coordinates: coordinates,
                    fillRule: "nonZero"
                },
                properties:{
                     polygon_id: ix
                }
            }, {
                fillColor: color, //Раскраска районов на карте
                strokeColor: '#CD0000',
                opacity: 0.3,
            });
            return p;
        };

        let cariers = {};
        for (const key in rules['cariers']) {
            if (rules['cariers'][key]['on'] == true ) {
                
                if (rules['cariers'][key]['options']['rount'] == true ) {
                    cariers[key] = rules['cariers'][key]['coord'];
                }else{
                    //! baloon
                    let coordsCariers = rules['cariers'][key]['coord'].split(',');
                    let styles = {
                        'container': `
                            background-color: #4C5D68;                       
                            border-radius: 50px;
                            padding: 5px;
                            display: flex !important;
                            gap: 10px;
                            align-items: center;
                            justify-content: center;
                        `,
                        'img': `
                            background-image: url(/images/buldozer.png) !important;
                            background-size: cover;
                            background-repeat: no-repeat;
                            background-position: center;
                            width: 24px !important;
                            height: 24px !important;
                            border-radius: 50%;
                            border: 3px solid white;
                            position: relative !important;
                            background-color: #fcc842;
                            position: relative !important;
                            margin: 0;
                        `,
                        'title': `
                            position: relative !important;
                            color: white;
                            font-weight: bold !important;
                            white-space: nowrap;
                            margin: 0;
                            font: 13px / 24px Arial, sans-serif;
                        `,
                    };  

                    var carierLayout = ymaps.templateLayoutFactory.createClass(`
                        <div class="placemark_layout_container" style="position: absolute;">
                            <div style='${styles['container']}'>
                                <p style='${styles['img']}'></p>
                                <p style='${styles['title']}'>${rules['cariers'][key]['options']['title']}</p>
                            </div>
                        </div>
                    `);

                    myMap.geoObjects.add(
                        new ymaps.Placemark([
                            coordsCariers[0],
                            coordsCariers[1]
                        ], {}, {
                            iconLayout: carierLayout
                        })
                    );
                }
            }
        };
        const carierCheck = carier => ( carier )? window.address : '' ;// проверка и подстановка адреса по дефолту

        if ( (JSON.parse(getCarier())) != null && (page === 'order') ) {
            cariers = JSON.parse(getCarier()); // Получаем список карьеров из корзины
        }
         //добавляем паенль управления маршрутами
        var routePanelControl = new ymaps.control.RoutePanel({options: rules['cariers']['borok']['options']});//rename
        var routePanelControl2 = new ymaps.control.RoutePanel({options: rules['cariers']['marusino']['options']});
        var routePanelControl3 = new ymaps.control.RoutePanel({options: rules['cariers']['kudrjashovskiy']['options']});
 
         //задаем адрес
        routePanelControl.routePanel.state.set({
            fromEnabled: false,
            from: rules['cariers']['borok']['coord'],
            to: carierCheck(rules['cariers']['borok']['coord']) 
        });
        routePanelControl2.routePanel.state.set({
            fromEnabled: false,
            from: rules['cariers']['marusino']['coord'],
            to: carierCheck(rules['cariers']['marusino']['coord'])
        });
        routePanelControl3.routePanel.state.set({
            fromEnabled: false,
            from: rules['cariers']['kudrjashovskiy']['coord'],
            to: carierCheck(rules['cariers']['kudrjashovskiy']['coord'])
        });


        zoomControl = new ymaps.control.ZoomControl({options: rules['zoomControl']['options']});
        if (page=='dilivery') {
            if(rules['cariers']['borok']['on']== true) myMap.controls.add(routePanelControl);
            if(rules['cariers']['marusino']['on']== true) myMap.controls.add(routePanelControl2);
            if(rules['cariers']['kudrjashovskiy']['on']== true) myMap.controls.add(routePanelControl3);
        } else {
            if(cariers['borok']) myMap.controls.add(routePanelControl);
            if(cariers['marusino']) myMap.controls.add(routePanelControl2);
            if(cariers['kudrjashovskiy']) myMap.controls.add(routePanelControl3);
        }

        // Создаем пользовательский интерфейс поиска.
        searchLayout = ymaps.templateLayoutFactory.createClass(
            `<div class="map__searchControl__container">
                <div class="map__searchControl__header">
                    <div class="map__searchControl__header__img-container">
                        <img class="map__searchControl__header__img" src="/images/b_img.png">
                    </div>
                    <span class="map__searchControl__header-title">Адрес доставки</span>
                </div>
                <div class="map__searchControl__content">
                    <form class="map__searchControl__content__form" id="map-searchControl-form">
                        <input class="map__searchControl__content__form-input-text" type="text" name="search" placeholder="Куда" id="mapSearch">
                        <input class="map__searchControl__content__form-input-btn" type="button" name="searchBtn" id="mapSearchBtn">
                    </form>
                </div>
            </div>`
            , {
            // Переопределяем методы макета, чтобы выполнять дополнительные действия
            // при построении и очистке макета.
            build: function () {
                // Вызываем родительский метод build.
                searchLayout.superclass.build.call(this);
                // Привязываем функции-обработчики к контексту и сохраняем ссылки
                // на них, чтобы потом отписаться от событий.
                this.searchCallback = ymaps.util.bind(this.search, this);
                // Начинаем слушать события на инпутах.
                $('#map-searchControl-form').bind('submit', this.searchCallback);
                $('#mapSearchBtn').on('click', () => {
                    $('#map-searchControl-form').trigger('submit');
                });
            },
            search: function(e) {
                e.preventDefault();

                var ctrl = this.getData().control;
                let data = $('#mapSearch').val();
                let option = {
                    provider: 'yandex#map',
                    boundedBy: myYmapsBounds, //границы, которые задал в начале скрипта
                    noSuggestPanel: true,
                    noPlacemark: true, // true - не добавлять балун на месте найденого объекта
                    suppressYandexSearch: true, //Скрывать ли сообщение с предложением произвести поиск на портале Яндекса
                    noCentering: true, //отключить автоматическиое расположение центра карты
                }

                ctrl.search(data, option).then(function (value) {
                    var geoObjectsArray = searchControl.getResultsArray();
                    if (geoObjectsArray.length) {
                        let mySearchResultCoord = geoObjectsArray[0].geometry.getCoordinates();
                        coordinates = mySearchResultCoord;
                        myMap.geoObjects.each(function (item) {

                            if (item.geometry.getType() == "Polygon") {
                                if (!item.geometry.contains(mySearchResultCoord)) {
                                    window.polygon_id = "";
                                    coordinates = "";
                                };
                            };
                        });

                        myMap.geoObjects.each(function (item) {
                            
                            if (item.geometry.getType() == "Polygon") {
                                if (item.geometry.contains(mySearchResultCoord)) {
                                    window.polygon_id = item.properties.get('polygon_id');
                                    coordinates = mySearchResultCoord;
                                };
                            };
                        });

                        [routePanelControl, routePanelControl2, routePanelControl3].forEach(item => {
                            item.routePanel.state.set({
                                fromEnabled: false,
                                to: mySearchResultCoord
                            });
                        });
                    };
                });
            }
        });

        searchControl = new ymaps.control.SearchControl({options: {
            layout: searchLayout,
            provider: 'yandex#map',
            useMapBounds: true,
        }});
        myMap.controls.add(searchControl);

        let suggestView;
        const searchLayoutRenderCheck = () => {//костыль для проверки на наличие инпута. pls fix me
            if (!document.getElementById('mapSearch')) {
                setTimeout( searchLayoutRenderCheck , 500);
            } else {
                suggestView = new ymaps.SuggestView('mapSearch', {
                    boundedBy: myYmapsBounds,
                    provider: {
                        suggest: (function(request, options) {
                            return ymaps.suggest("Новосибирская область, " + request);
                        })
                    },
                })
                asyncSuggestView();
            }
        };
        searchLayoutRenderCheck();

        const asyncSuggestView = () => {
            suggestView.events.add('select', (event) => {

                event.preventDefault();
                getItem = event.get('item');

                // Выводит свойство address выбранного геообъекта из результатов запроса.
                let MySearchResult = getItem.value;

                ymaps.geocode(event.get('item').value).then(function (res) {//переделать
                    search_new_coord = res.geoObjects.get(0).properties.get('boundedBy')[0];
                    search_new_coord_2 = res.geoObjects.get(0).properties.get('boundedBy')[1];
                    search_new_coord_sr_0 = ((search_new_coord[0]+search_new_coord_2[0])/2);
                    search_new_coord_sr_1 = ((search_new_coord[1]+search_new_coord_2[1])/2);
                    search_new_coord_sr = [search_new_coord_sr_0,search_new_coord_sr_1];
                    coordinates = search_new_coord_sr;

                    myMap.geoObjects.each(function (item) {
                        if(item.geometry.getType() == "Polygon"){
                            if (item.geometry.contains(search_new_coord_sr)) {
                                window.polygon_id = item.properties.get('polygon_id');

                                rules['coordinatesException']['polygon'].each(function (item) {
                                    if (res.geoObjects.get(0).properties.get('name') == item[0]) {
                                        window.polygon_id = item[1];
                                    }
                                })
                                return false;
                            }
                            else{
                                window.polygon_id = 1;
                            }
                        }
                    });
                });
                [routePanelControl, routePanelControl2, routePanelControl3].forEach(item => {
                    item.routePanel.state.set({
                        fromEnabled: false,
                        to: MySearchResult,
                        autofocus: false,
                    });
                });
            })
        };
        if (cariers.kudrjashovskiy != 0) {
            routePanelControl.routePanel.getRouteAsync().then(function (route) {
                let name = '<b class="car-b-n">Карьер Борок, '+cariers.borok+'</b>';
                pathPoint(route, 'Борок', name, '#000080');
            });
        };
        if ( cariers.marusino != 0) {
            routePanelControl2.routePanel.getRouteAsync().then(function (route) {
                let name = '<b class="car-b-n">Карьер Марусино, '+cariers.marusino+'</b>';
                pathPoint(route, 'Марусино', name, '#008000');
            });
        };
        if (cariers.kudrjashovskiy != 0) {
            routePanelControl3.routePanel.getRouteAsync().then(function (route) {
                let name = '<b class="car-b-n">Карьер Кудряшовский </b>';
                pathPoint(route, 'Кудряшовский', name, '#008000');
            });
        };

        function pathPoint(route, carier, name, colorMarshrut) {
            route.model.setParams({
                results: 1,
                mapStateAutoApply: false,
            }, true);

            route.model.events.add('requestsuccess', function () {

            var wayPoints = route.getWayPoints();
            var startPoint = wayPoints.get(0); //Название 1й точки с html
            startPoint.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass('$[properties.name]'))
            startPoint.properties.set('name', name);
            if(carier !== 'Борок') wayPoints.get(1).options.set('visible', false);

            var activeRoute = route.getActiveRoute();

            if (activeRoute) {
                activeRoute.options.set('strokeColor', colorMarshrut);// Цвет маршрута
                name_locations = route.properties.get("waypoints")[1].geocoderMetaData.Address.Components
                var name_location = '';

                for (var key in name_locations) {
                    if (name_locations[key].kind == 'locality' && name_locations[key].name == 'Новосибирск') {
                        name_location = name_locations[key].name;
                        break;
                    } else if(name_locations[key].kind == 'locality'){
                        name_location = name_locations[key].name;
                    }
                }

                var name_location_street1 = "";

                for (var key in name_locations) {
                    if (name_locations[key].kind == 'locality') {
                        if(name_locations[key].name != undefined)
                        name_location_street1 += name_locations[key].name
                        name_location_street1+=" "
                    }
                    if (name_locations[key].kind == 'street') {
                        if(name_locations[key].name != undefined)
                        name_location_street1 += name_locations[key].name
                        name_location_street1+=" "
                    }
                    if (name_locations[key].kind == 'house') {
                        if(name_locations[key].name != undefined)
                        name_location_street1 += name_locations[key].name
                    }
                }

                setDeliveryAddress(carier, name_location_street1); // передаем адрес доставки в заголовок таблицы вывода товаров

                if ( name_location != '' && rules['nameLocation'].includes(name_location)) {
                    var length = route.getActiveRoute().properties.get("distance");
                    var data_length = Math.round(route.getActiveRoute().properties.get("distance").value / 1000);

                    if(!coordinates || coordinates == ''){
                        coordinates = route.properties.get("waypoints")[1].request;
                    }

                    var price_data = [name_location, data_length, carier, name_location_street1, coordinates];
                    var price = JSON.parse(getPrice(price_data));

                    if (price != null) {
                        doneCalc(ymaps, route, activeRoute, name_location, length, price, carier);
                        showPrice(price);//Подгружаем цены
                    } else {
                        failCalc(ymaps, route, activeRoute);
                    }

                } else {
                    coordinates = route.properties.get("waypoints")[1].request;
                    district = findDistrict(coordinates);

                    rules['coordinatesException']['coordinates'].forEach(item => {
                        if(item[0].includes(coordinates)) district = item[1];
                    });
                    rules['coordinatesException']['street'].forEach(item => {
                        if(item[0].includes(coordinates)) district = item[1];
                    });

                    var length = route.getActiveRoute().properties.get("distance");
                    var data_length = Math.round(route.getActiveRoute().properties.get("distance").value / 1000);
                    var price_data = [district, data_length, carier, name_location_street1, coordinates];

                    var price = JSON.parse(getPrice(price_data));
                    if (price != null) {
                        doneCalc(ymaps, route, activeRoute, district, length, price, carier);
                        showPrice(price);//Подгружаем цены
                    } else {
                        failCalc(ymaps, route, activeRoute);
                    }
                }
            }
        });

        };

        function getPrice($data){
            var value = 0;
            if($data[0] === "" && window.raion !="") $data[0] = window.raion;
            if(window.polygon_id ==0 &&  window.polygon_id != 1) window.polygon_id = window.poligon;

            if($data[0] != '' && $data[2] != '' && $data[4]!="") {
                value = $.ajax({
                    type: 'POST',
                    url: urlAjax,
                    async: false,
                    data: "location=" + $data[0] + "&length=" + $data[1] + "&kar=" + $data[2] + "&adress_new=" + $data[3] + "&coordinates=" + $data[4]+ "&polygon_id=" + window.polygon_id,
                    dataType: 'json',
                }).responseText;
            }
            return value;
        }
        function doneCalc(ymaps, route,activeRoute ,location,length,price, car){
            balloonContentLayout = ymaps.templateLayoutFactory.createClass(
                '<span>Доставка из карьера '+car+' в ' + location +  '.</span><br/>' +
                '<span>Расстояние: ' + length.text +'</span><br/>' +
                '<span style="font-weight: bold; font-style: italic">Стоимость доставки:</span><br/>' +
                '<span style="font-weight: bold; font-style: italic">Грузовик 5т: ' + price.t5 + ' р.</span><br/>' +
                '<span style="font-weight: bold; font-style: italic">Грузовик 15т: ' + price.t15 + ' р.</span>');
            route.options.set('routeBalloonContentLayout', balloonContentLayout);
            //activeRoute.balloon.open();
            $('.non-delivery').hide();
            $('.production_delivery_show_hide').show();
            $('.messages_delivery').html("");
            if(price ==0){
                $('.non-delivery').show();
                $('.production_delivery_show_hide').hide();
            }
        }
        function failCalc(ymaps, route,activeRoute ,location,length,price, car){
            $('.non-delivery').show();
            $('.production_delivery_show_hide').hide();
        }
        function getCarier(){
            var value = 0;
            value = $.ajax({
                type: 'POST',
                url: urlAjax,
                async: false,
                data: "count_carier=1",
                dataType: 'json',
            }).responseText;
            return value;
        }
        function findDistrict(coordinates){
            var value = 0;
            value = $.ajax({
                type: 'POST',
                url: urlAjax,
                async: false,
                data: "find-district="+coordinates,
                dataType: 'json',
            }).responseText;

            return value;
        }
        function showPrice(price) {
            var pp5 = 0;
            var pp15 = 0;
            for (var key in price.item) {
                pp5 = 0;
                pp15 = 0;
                if (price.item[key]['price_t5'] > 0 && price.item[key]['5t'] > 0) {
                    $('.one-5-' + key).text( price.item[key]['price_t5'] + ' руб.');
                    pp5 = price.item[key]['price_t5'] * price.item[key]['5t'];
                }
                if (price.item[key]['price_t15'] && price.item[key]['15t'] > 0) {
                    $('.one-15-' + key).text( price.item[key]['price_t15'] + ' руб.');
                    pp15 = price.item[key]['price_t15'] * price.item[key]['15t'];
                }
                if(pp5 || pp15){
                    if(pp5) $('.all-pp-' + key).text( pp5 + ' руб.');
                    if(pp15) $('.all-pp-' + key).text( pp15 + ' руб.');
                }
            }

            //прокрутка до цен
            var target = "price";
                $target = $('.production_delivery_show_hide');

            $('html, body').stop().animate({
                'scrollTop': $target.offset().top
                }, 1000, 'swing', function () {
                window.location.hash = target;
                });
        }
        var setDeliveryAddress =  function(carier, address){
            var hideChecker = function(elem) {
                if ( elem.classList.contains('hide') ) {
                    elem.classList.remove('hide')
                }
            };
            switch (carier) {
                case 'Борок':
                    var elem = document.querySelector('#borok_delivery_b');
                    elem.textContent = address;
                    hideChecker(elem);
                    break;
                case 'Марусино':
                    var elem = document.querySelector('#marusino_delivery_b');
                    elem.textContent = address;
                    hideChecker(elem);
                    break;
                case 'Кудряшовский':
                    var elem = document.querySelector('#kudrjashovskiy_delivery_b');
                    elem.textContent = address;
                    hideChecker(elem);
                    break;
                default:
                    console.log('Проверьте правильность переменной carier');
                    break;
            };
        };
    }

    $('.samov').click(function(){
        $.ajax({
            type: 'POST',
            url: "/price/delivery/ajax.php",
            async: false,
            data: "samovivos=1",
            success: (response) => {
            document.location.href = $(this).attr('href');
    }
    });
        return false;
    });

    $('.delivery_true').click(function () {
         $.ajax({
             type: 'POST',
             url: "/order/map/ajax.php",
             async: false,
             data: "delivery_true=1",
             success: (response) => {
                 document.location.href = $(this).attr('href');
             }
         });
         return false;
     })
});

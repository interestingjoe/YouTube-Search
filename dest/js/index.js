(() => {
    let main = {
        api: 'https://content.googleapis.com/youtube/v3/',
        paramPart: 'part=snippet',
        outputElem: document.getElementsByClassName('output')[0],
        init: () => {
            main.setEvent();
        },
        setEvent: () => {
            $('#search').off();
            $('#search').on('click', () => {
                let input = document.getElementById('input');

                if (input.value === '') {
                    return;
                }
                main.outputElem.innerHTML = 'Loading...';
                let url = `${main.api}search?${main.paramPart}&key=${config.apiKey}&q=${encodeURIComponent(input.value.trim())}`;
                main.fetchPromise(url);
            });

            $('#clear').off();
            $('#clear').on('click', () => {
                main.outputElem.innerHTML = '';
                document.getElementById('input').value = '';
            });
        },
        fetchPromise: url => {
            main.fetchAPI(url)
                .then(response => {
                    console.log('response', response);
                    if (response.items.length > 0) {
                        main.outputElem.innerHTML = '';
                        main.output(response, url);
                        return response.items;
                    } else {
                        let p = document.createElement('p');
                        p.classList.add('warning');
                        p.innerHTML = 'No matching videos';
                        main.outputElem.innerHTML = '';
                        main.outputElem.appendChild(p);
                    }
                })
                .then(async response => {
                    console.log('2nd', response);
                    let arr = [];
                    for (const key in response) {
                        if (response[key]['id']['videoId'] === undefined) {
                            continue;
                        }
                        let url = `${main.api}videos?${main.paramPart}&key=${config.apiKey}&id=${response[key]['id']['videoId']}`;
                        let item = await main.fetchAPI(url);
                        arr.push(item);
                    }
                    return await Promise.all(arr);
                })
                .then(response => {
                    console.log('3rd');
                    if (response.length > 0) {
                        for (const key in response) {
                            if (
                                response[key]['items'][0]['id'] === undefined || 
                                (response[key]['items'][0]['snippet']['tags'] === undefined || response[key]['items'][0]['snippet']['tags'] === [])
                            ) {
                                continue;
                            }
                            let p = document.createElement('p');
                            p.classList.add('tags');
                            let copy = response[key]['items'][0]['snippet']['tags'];
                            p.innerHTML = '<strong>Video Tags:</strong> ' + copy.toString();

                            let li = document.querySelector(`[data-id='${response[key]['items'][0]['id']}'`);
                            li.appendChild(p);
                        }
                    } else {
                        console.log('No available tags');
                    }
                })
                .catch(() => {
                    let p = document.createElement('p');
                    p.classList.add('error');
                    p.innerHTML = 'Error fetching data';
                    main.outputElem.innerHTML = '';
                    main.outputElem.appendChild(p);
                });
        },
        fetchAPI: async (api) => {
            if (api === undefined || api === '') {
                return;
            }
            let response = await fetch(api);
            return response.json();
        },
        pagination: (data, url) => {
            let setButton = (copy, attr, param) => {
                let button = document.createElement('button');
                button.setAttribute('id', attr);
                button.innerHTML = copy;
                div.appendChild(button);

                $(`#${attr}`).off();
                $(`#${attr}`).on('click', (e) => {
                    e.preventDefault();
                    main.outputElem.innerHTML = 'Loading...';
                    main.fetchPromise(`${url}&pageToken=${param}`);
                });
            }

            let div = document.createElement('div');
            div.classList.add('pagination');
            main.outputElem.appendChild(div);

            if (data.prevPageToken !== undefined) {
                setButton('PREVIOUS', 'prev', data.prevPageToken);
            }
            if (data.nextPageToken !== undefined) {
                setButton('NEXT', 'next', data.nextPageToken);
            }
        },
        output: (data, url) => {
            let dataItems = data.items;
            let renderElem = (tag, className, data, copy) => {
                let elem = document.createElement(tag);
                elem.classList.add(className);

                if (tag === 'img' && data !== null) {
                    elem.setAttribute('src', data);
                }
                if (tag === 'a' && data !== null) {
                    elem.setAttribute('href', data);
                }
                if (copy !== null) {
                    elem.innerHTML = copy;
                }

                return elem;
            }

            if (dataItems === undefined || dataItems === {}) {
                return;
            }

            let ul = document.createElement('ul');
            ul.classList.add('list');
            main.outputElem.appendChild(ul);

            for (const key in dataItems) {
                let videoID = dataItems[key]['id']['videoId'];

                let li = document.createElement('li');
                li.setAttribute('data-id', videoID);
                ul.appendChild(li);

                let a = renderElem('a', 'image', `https://www.youtube.com/watch?v=${videoID}`, null);
                li.appendChild(a);

                let img = renderElem('img', 'thumbnail', `${dataItems[key]['snippet']['thumbnails']['default']['url']}`, null);
                img.setAttribute('alt', `${dataItems[key]['snippet']['title']}`);
                a.appendChild(img);

                let div = renderElem('div', 'copy', null, null);
                li.appendChild(div);
                div.appendChild(renderElem('h3', 'title', null, `${dataItems[key]['snippet']['title']}`));
                div.appendChild(renderElem('h4', 'description', null, `${dataItems[key]['snippet']['description']}`));
            }

            main.pagination(data, url);
        }
    };

    $(document).ready(() => {
        main.init();
    });
})();

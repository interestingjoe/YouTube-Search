(() => {
    let main = {
        init: () => {
            main.search();
        },
        search: () => {
            let outputElem = document.getElementsByClassName('output')[0];
            let api = 'https://content.googleapis.com/youtube/v3/';
            let paramPart = 'part=snippet';

            $('#button').off();
            $('#button').on('click', () => {
                let input = document.getElementById('input');

                if (input.value === '') {
                    return;
                }
                outputElem.innerHTML = 'Loading...';
                let url = `${api}search?${paramPart}&key=${config.apiKey}&q=${encodeURIComponent(input.value.trim())}`;

                main.fetchAPI(url)
                    .then(response => {
                        if (response.items.length > 0) {
                            outputElem.innerHTML = '';
                            main.output(response.items);
                            return response.items;
                        } else {
                            let p = document.createElement('p');
                            p.classList.add('warning');
                            p.innerHTML = 'No matching videos';
                            outputElem.innerHTML = '';
                            outputElem.appendChild(p);
                        }
                    })
                    .then(async response => {
                        let arr = [];
                        for (const key in response) {
                            if (response[key]['id']['videoId'] === undefined) {
                                continue;
                            }
                            let url = `${api}videos?${paramPart}&key=${config.apiKey}&id=${response[key]['id']['videoId']}`;
                            let item = await main.fetchAPI(url);
                            arr.push(item);
                        }
                        return await Promise.all(arr);
                    })
                    .then(response => {
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
                        outputElem.innerHTML = '';
                        outputElem.appendChild(p);
                    });
            });
        },
        fetchAPI: async (api) => {
            if (api === undefined || api === '') {
                return;
            }
            let response = await fetch(api);
            return response.json();
        },
        output: data => {
            let outputElem = document.getElementsByClassName('output')[0];
            let renderElem = (parent, tag, attr, data) => {
                let elem = document.createElement(tag);
                elem.classList.add(attr);

                if (tag === 'img') {
                    elem.setAttribute('src', data);
                } else if (tag === 'a') {
                    elem.setAttribute('href', data);
                } else {
                    elem.innerHTML = data;
                }

                parent.appendChild(elem);
            }

            if (data === undefined || data === {}) {
                return;
            }

            let ul = document.createElement('ul');
            ul.classList.add('list');
            outputElem.appendChild(ul);

            for (const key in data) {
                let li = document.createElement('li');
                li.setAttribute('data-id', `${data[key]['id']['videoId']}`);

                let a = document.createElement('a');
                a.setAttribute('href', `https://www.youtube.com/watch?v=${data[key]['id']['videoId']}`);
                li.appendChild(a);

                renderElem(a, 'img', 'thumbnail', `${data[key]['snippet']['thumbnails']['default']['url']}`);
                renderElem(li, 'h3', 'title', `${data[key]['snippet']['title']}`);
                renderElem(li, 'h4', 'description', `${data[key]['snippet']['description']}`);

                ul.appendChild(li);
            }
        }
    };

    $(document).ready(() => {
        main.init();
    });
})();

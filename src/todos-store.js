import uuidv4 from 'uuid/v4';
import createApp from 'peer-star-app';

let todos;
const subscribers = new Set();

const publishStateChange = (todos) => subscribers.forEach((listener) => listener(todos));

const app = createApp('todo-dapp');
app.on('error', (err) => console.error('error in app:', err));

let collaboration;

const peersSubscribers = new Set();
const publishPeersChange = (peers) => peersSubscribers.forEach((listener) => listener(peers));

export default {
    async load() {
        await app.start();

        collaboration = await app.collaborate('todos-of-mtojek', 'rga');

        collaboration.removeAllListeners('state changed');
        collaboration.on('state changed', () => {
            todos = collaboration.shared.value();
            publishStateChange(todos);
        });

        todos = collaboration.shared.value();

        collaboration.removeAllListeners('membership changed');
        collaboration.on('membership changed', publishPeersChange);

        return todos;
    },

    add(title) {
        collaboration.shared.push({ id: uuidv4(), title, completed: false });
    },

    remove(id) {
        const index = todos.findIndex((todo) => todo.id === id);

        if (index === -1) {
            return;
        }

        collaboration.shared.removeAt(index);
    },

    updateTitle(id, title) {
        const index = todos.findIndex((todo) => todo.id === id);
        const todo = todos[index];

        if (!todo || todo.title === title) {
            return;
        }

        const updatedTodo = { ...todo, title };

        collaboration.shared.updateAt(index, updatedTodo);
    },

    updateCompleted(id, completed) {
        const index = todos.findIndex((todo) => todo.id === id);
        const todo = todos[index];

        if (!todo || todo.completed === completed) {
            return;
        }

        const updatedTodo = { ...todo, completed };

        collaboration.shared.updateAt(index, updatedTodo);
    },

    updateAllCompleted(completed) {
        todos.forEach((todo) => this.updateCompleted(todo.id, completed));
    },

    clearCompleted() {
        todos
        .filter((todo) => todo.completed)
        .reverse()
        .forEach((todo) => this.remove(todo.id));
    },

    subscribe(subscriber) {
        subscribers.add(subscriber);

        return () => subscribers.remove(subscriber);
    },

    subscribePeers(subscriber) {
        peersSubscribers.add(subscriber);

        return () => peersSubscribers.remove(subscriber);
    },
};

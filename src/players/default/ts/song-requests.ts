import { ajaxPost } from '../../../misc/ajax';

function toggleControls(form: HTMLElement, disabled: boolean) {
    const button = form.querySelector('button');

    if (!button) {
        return;
    }

    button.disabled = disabled;
}

function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const body = new FormData(form);
    body.append('email', 'deprecated@example.com');
    body.append('cidade', 'deprecated');
    body.append(
        'aba',
        document.querySelector<HTMLInputElement>('#request-song')?.value
            ? 'pedido'
            : 'recado',
    );
    body.append('request', 'ODAwOA==');
    body.append('is_app', 'true');

    toggleControls(form, true);

    ajaxPost(form.action, body, data => {
        if (data !== 'true') {
            alert(data);
            toggleControls(form, false);
            return;
        }

        alert(
            'Pedido enviado com sucesso. Cabe exclusivamente ao DJ no ar atendê-lo ou não.',
        );
        toggleControls(form, false);
        form.reset();
    });
}

export function setupRequests() {
    const form = document.querySelector<HTMLFormElement>('#requests form');
    form?.removeEventListener('submit', onSubmit);
    form?.addEventListener('submit', onSubmit);
}

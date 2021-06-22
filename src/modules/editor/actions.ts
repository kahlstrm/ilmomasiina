import { AdminEvent } from '../../api/adminEvents';
import { DispatchAction } from '../../store/types';
import {
  SET_EVENT,
  SET_EVENT_ERROR,
  SET_EVENT_LOADING,
  SET_EVENT_PUBLISH_ERROR,
  SET_EVENT_PUBLISH_LOADING,
} from './actionTypes';
import { EditorEvent } from './types';

export const setEvent = (event: AdminEvent.Details | null, formData: EditorEvent | null) => <const>{
  type: SET_EVENT,
  payload: {
    event,
    formData,
  },
};

export const setEventLoading = () => <const>{
  type: SET_EVENT_LOADING,
};

export const setEventError = () => <const>{
  type: SET_EVENT_ERROR,
};

export const setEventPublishLoading = () => <const>{
  type: SET_EVENT_PUBLISH_LOADING,
};

export const setEventPublishError = () => <const>{
  type: SET_EVENT_PUBLISH_ERROR,
};

const serverEventToEditor = (event: AdminEvent.Details): EditorEvent => ({
  ...event,
  quotas: event.quota,
  useOpenQuota: event.openQuotaSize > 0,
  questions: event.questions.map((question) => ({
    ...question,
    options: question.options || [''],
  })),
});

const editorEventToServer = (form: EditorEvent): AdminEvent.Update.Body => ({
  ...form,
  quota: form.quotas,
  openQuotaSize: form.useOpenQuota ? form.openQuotaSize : 0,
  questions: form.questions.map((question) => ({
    ...question,
    options: question.type === 'select' || question.type === 'checkbox' ? question.options.join(';') : null,
  })),
});

export const clearEvent = () => setEvent(null, null);

export const publishNewEvent = (data: EditorEvent, token: string) => async (dispatch: DispatchAction) => {
  dispatch(setEventPublishLoading());

  const cleaned = editorEventToServer(data);

  try {
    const response = await fetch(`${PREFIX_URL}/api/admin/events`, {
      method: 'POST',
      body: JSON.stringify(cleaned),
      headers: {
        Authorization: token,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    if (response.status > 201) {
      throw new Error(response.statusText);
    }
    const newEvent = await response.json() as AdminEvent.Details;
    const newFormData = serverEventToEditor(newEvent);
    dispatch(setEvent(newEvent, newFormData));
    return newEvent;
  } catch (e) {
    dispatch(setEventPublishError());
    throw new Error(e);
  }
};

export const publishEventUpdate = (id: number | string, data: EditorEvent, token: string) => async (
  dispatch: DispatchAction,
) => {
  dispatch(setEventPublishLoading());

  const cleaned = editorEventToServer(data);

  try {
    const response = await fetch(`${PREFIX_URL}/api/admin/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cleaned),
      headers: {
        Authorization: token,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    if (response.status > 201) {
      throw new Error(response.statusText);
    }
    const newEvent = await response.json() as AdminEvent.Details;
    const newFormData = serverEventToEditor(newEvent);
    dispatch(setEvent(newEvent, newFormData));
    return newEvent;
  } catch (e) {
    dispatch(setEventPublishError());
    throw new Error(e);
  }
};

export const getEvent = (id: number | string, token: string) => async (dispatch: DispatchAction) => {
  dispatch(setEventLoading());
  try {
    const response = await fetch(`${PREFIX_URL}/api/admin/events/${id}`, {
      headers: { Authorization: token },
    });
    const event = await response.json() as AdminEvent.Details;
    const formData = serverEventToEditor(event);
    dispatch(setEvent(event, formData));
  } catch (e) {
    dispatch(setEventError());
  }
};

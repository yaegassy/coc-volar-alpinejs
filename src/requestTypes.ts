import * as coc from 'coc.nvim';
import * as shared from '@volar/shared';

/**
 * Client Requests
 */

export const ShowReferencesNotificationType = new coc.NotificationType<shared.ShowReferencesNotification.ResponseType>(
  shared.ShowReferencesNotification.type.method
);

export const GetDocumentVersionRequestType = new coc.RequestType<
  shared.GetDocumentVersionRequest.ParamsType,
  shared.GetDocumentVersionRequest.ResponseType,
  shared.GetDocumentVersionRequest.ErrorType
>(shared.GetDocumentVersionRequest.type.method);

export const FindFileReferenceRequestType = new coc.RequestType<
  shared.FindFileReferenceRequest.ParamsType,
  shared.FindFileReferenceRequest.ResponseType,
  shared.FindFileReferenceRequest.ErrorType
>(shared.FindFileReferenceRequest.type.method);

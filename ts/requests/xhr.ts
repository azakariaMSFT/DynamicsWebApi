﻿import { DynamicsWebApi } from "../../types/dynamics-web-api-types";
import { ErrorHelper } from "./../helpers/ErrorHelper";
import { parseResponse } from "./helpers/parseResponse";
import { parseResponseHeaders } from "./helpers/parseResponseHeaders";

//if (!Array.isArray) {
//    require("../polyfills/Array-es6");
//}

/**
 * Sends a request to given URL with given parameters
 *
 */
function xhrRequest (options: DynamicsWebApi.Core.RequestOptions) {
    const method = options.method;
    const uri = options.uri;
    const data = options.data;
    const additionalHeaders = options.additionalHeaders;
    const responseParams = options.responseParams;
    const successCallback = options.successCallback;
    const errorCallback = options.errorCallback;
    const isAsync = options.isAsync;

    var request = new XMLHttpRequest();
    request.open(method, uri, isAsync);

    //set additional headers
    for (var key in additionalHeaders) {
        request.setRequestHeader(key, additionalHeaders[key]);
    }

    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            switch (request.status) {
                case 200: // Success with content returned in response body.
                case 201: // Success with content returned in response body.
                case 204: // Success with no content returned in response body.
                case 304: {// Success with Not Modified
                    var responseHeaders = parseResponseHeaders(request.getAllResponseHeaders());
                    var responseData = parseResponse(request.responseText, responseHeaders, responseParams);

                    var response = {
                        data: responseData,
                        headers: responseHeaders,
                        status: request.status
                    };

                    successCallback(response);
                    break;
                }
                default: // All other statuses are error cases.
                    var error;
                    try {
                        var errorParsed = parseResponse(request.responseText, parseResponseHeaders(request.getAllResponseHeaders()), responseParams);

                        if (Array.isArray(errorParsed)) {
                            errorCallback(errorParsed);
                            break;
                        }

                        error = errorParsed.error;
                    } catch (e) {
                        if (request.response.length > 0) {
                            error = { message: request.response };
                        }
                        else {
                            error = { message: "Unexpected Error" };
                        }
                    }

                    errorCallback(ErrorHelper.handleHttpError(error, {
                        status: request.status,
                        statusText: request.statusText
                    }));

                    break;
            }

            request = null;
            responseParams.length = 0;
        }
    };

    if (options.timeout) {
        request.timeout = options.timeout;
    }

    request.onerror = function () {
        errorCallback(ErrorHelper.handleHttpError({
            status: request.status,
            statusText: request.statusText,
            message: request.responseText || "Network Error"
        }));
        responseParams.length = 0;
        request = null;
    };

    request.ontimeout = function () {
        errorCallback(ErrorHelper.handleHttpError({
            status: request.status,
            statusText: request.statusText,
            message: request.responseText || "Request Timed Out"
        }));
        responseParams.length = 0;
        request = null;
    };

    data
        ? request.send(data)
        : request.send();
};

export = xhrRequest;
import { AxiosResponse } from "axios";
import * as React from "react";
import ReactJson from "react-json-view";

interface IComponentProps {
    requestResponse: AxiosResponse | null;
}

class HttpResponseJsonViewer extends React.Component<IComponentProps, {}> {
    public getHttpResponseJsonViewer = (requestResponse: AxiosResponse | null) => {
        if (!requestResponse) {
            return (
                <ReactJson src={{}} name="noResponse" />
            );
        } else if (!requestResponse.data) {
            return (
                <ReactJson src={{}} name="noDataInResponse" />
            );
        } else {
            return (
                <ReactJson
                    // tslint:disable-next-line:max-line-length
                    src={typeof requestResponse.data === "string" ? JSON.parse(requestResponse.data) : requestResponse.data}
                    name={"ratingResponsePayload"}
                />
            );
        }
    }

    public render() {
        return (
            <div className="json-viewer">
                {this.getHttpResponseJsonViewer(this.props.requestResponse)}
            </div>
        );
    }
}

export default HttpResponseJsonViewer;

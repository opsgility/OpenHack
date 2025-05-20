import axios, { AxiosResponse } from "axios";
import Slider, { Handle } from "rc-slider";
import "rc-slider/assets/index.css";
import Tooltip from "rc-tooltip";
import * as React from "react";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import ReactJson from "react-json-view";
import { isWebUri } from "valid-url";
import * as dropdownOptions from "../constants/dropdown-constants";
import { IDropdownOption, IRating } from "../interfaces/interfaces";
import "../stylesheets/App.css";
import ResponseJsonViewer from "./ResponseJsonViewer";

const defaultRatingValue = 3;

interface IComponentState {
    isSubmitting: boolean;
    rating: IRating;
    ratingEndpoint: string;
    ratingEndpointError: string | null;
    requestResponse: AxiosResponse | null;
}

class App extends React.Component<{}, IComponentState> {

    public state: IComponentState = {
        isSubmitting: false,
        rating: {
            locationName: dropdownOptions.locationOptions[0].value,
            productId: dropdownOptions.productOptions[0].value,
            rating: defaultRatingValue,
            userId: dropdownOptions.userOptions[0].value,
            userNotes: "I like ice cream!",
        },
        ratingEndpoint: "",
        ratingEndpointError: null,
        requestResponse: null,
    };

    public onChangeRatingEndpoint = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            ratingEndpoint: event.target.value,
            ratingEndpointError: null,
        });
    }

    public onTextAreaChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        this.setState((prevState) => {
            return {
                ...prevState,
                rating: this.getNewRating(prevState.rating, event.target.value, fieldName),
            };
        });
    }

    public onSelectOption = (option: { value: string, label: string }, fieldName: string) => {
        this.setState((prevState) => {
            return {
                ...prevState,
                rating: this.getNewRating(prevState.rating, option.value, fieldName),
            };
        });
    }

    public handleSliderTooltipRender = (props: any) => {
        const { value, dragging, index, ...restProps } = props;
        return (
            <Tooltip
                prefixCls="rc-slider-tooltip"
                overlay={value}
                visible={dragging}
                placement="top"
                key={index}
            >
                <Handle value={value} {...restProps} />
            </Tooltip>
        );
    }

    public handleSliderChange = (value: number) => {
        this.setState((prevState) => {
            return {
                ...prevState,
                rating: this.getNewRating(prevState.rating, value, "rating"),
            };
        });
        return undefined;
    }

    public handleSubmit = (event: any) => {
        if (this.state.ratingEndpoint && isWebUri(this.state.ratingEndpoint)) {
            this.setState({
                isSubmitting: true,
            });
            axios.post(this.state.ratingEndpoint, this.state.rating).then((response: AxiosResponse) => {
                this.setState({
                    isSubmitting: false,
                    requestResponse: response,
                });
            })
                .catch((e) => {
                    // tslint:disable-next-line:no-console
                    this.setState({
                        isSubmitting: false,
                        requestResponse: e.response ? e.response : e,
                    });
                });
        } else {
            this.setState({
                ratingEndpointError: "Invalid URL! Check to make sure your function endpoint was inputted correctly.",
            });
            setTimeout(() => {
                this.setState({
                    ratingEndpointError: null,
                });
            }, 5000);
        }
    }

    public getHttpResponseStatusText = () => {
        const requestResponse = this.state.requestResponse;
        // submitting http request
        if (this.state.isSubmitting) {
            return (
                <div style={{ color: "gray" }}>Working....</div>
            );
            // not submitting and no completed response yet
        } else if (!requestResponse) {
            return;
            // not submitting and complete response
        } else {
            let textColor = "gray";
            if (requestResponse.status === 200) {
                textColor = "green";
            }
            return requestResponse.status ? (
                // request responses with a status property mean the axios.post call received an AxiosResponse
                <div style={{ color: textColor }}>
                    Received HTTP Status {requestResponse.status.toString()}
                </div>
            ) :
            (
                // tslint:disable-next-line:max-line-length
                // errors from the axios.post call have different structure than an AxiosResponse and begin with the text "Error: "
                <div style={{ color: textColor }}>
                    {requestResponse.toString()}
                </div>
            );
        }
    }

    public render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img
                        // tslint:disable-next-line:max-line-length
                        src="https://serverlessohwesteurope.blob.core.windows.net/public/ice-cream-2202561_320-circle.jpg"
                        className="App-logo"
                        alt="logo"
                    />
                    <div className="App-title">Rate Your Ice Cream!</div>
                </header>
                <div>
                    <div className="rating-form">
                        <label className="rating-entry" style={{ display: "block" }}>
                            Rating Endpoint:
                            <input
                                style={{ width: "80%", display: "block", padding: "5px" }}
                                className="rating-entry-input"
                                // value={this.state.ratingEndpoint}
                                onChange={this.onChangeRatingEndpoint}
                            />
                            <div style={{ width: "80%", padding: "0px 0px 0px 5px", color: "red" }}>
                                {this.state.ratingEndpointError ? this.state.ratingEndpointError : ""}
                            </div>
                        </label>
                        <label className="rating-entry" style={{ display: "block" }}>
                            Users:
                        <Dropdown
                                className="rating-entry-input"
                                options={dropdownOptions.userOptions}
                                onChange={
                                    (option: IDropdownOption) => this.onSelectOption(option, "userId") // tslint:disable-line
                                }
                                value={dropdownOptions.userOptions[0]}
                                placeholder="Select a user"
                        />
                        </label>
                        <label className="rating-entry" style={{ display: "block" }}>
                            Products:
                        <Dropdown
                                className="rating-entry-input"
                                options={dropdownOptions.productOptions}
                                onChange={
                                    (option: IDropdownOption) => this.onSelectOption(option, "productId") // tslint:disable-line
                                }
                                value={dropdownOptions.productOptions[0]}
                                placeholder="Select a product"
                        />
                        </label>
                        <label className="rating-entry" style={{ display: "block" }}>
                            Location:
                            <Dropdown
                                className="rating-entry-input"
                                options={dropdownOptions.locationOptions}
                                onChange={
                                    (option: IDropdownOption) => this.onSelectOption(option, "locationName") // tslint:disable-line
                                }
                                value={dropdownOptions.locationOptions[0]}
                                placeholder="Select a location"
                            />
                        </label>
                        <label className="rating-entry" style={{ display: "block" }}>
                            Rating:
                            <div className="rating-slider-container">
                                <Slider
                                    className="rating-entry-input"
                                    min={0}
                                    max={5}
                                    dots={true}
                                    defaultValue={defaultRatingValue}
                                    handle={this.handleSliderTooltipRender}
                                    onChange={this.handleSliderChange}
                                />
                            </div>
                        </label>
                        <label className="rating-entry" style={{ display: "block" }}>
                            User Notes:
                            <input
                                className="rating-entry-input"
                                style={{ width: "80%", display: "block", padding: "5px" }}
                                value={this.state.rating.userNotes}
                                onChange={
                                    (event) => {
                                        event.persist();
                                        this.onTextAreaChange(event, "userNotes");
                                    } //tslint:disable-line
                                }
                            />
                        </label>
                        <button
                            style={{ display: "inline-block", float: "left" }}
                            className="submit-button"
                            onClick={this.handleSubmit}
                        >
                            Submit Rating
                        </button>
                        <div
                            style={{ display: "inline-block", float: "right", padding: "5px 0px 0px 0px" }}
                        >
                            {this.getHttpResponseStatusText()}
                        </div>
                    </div>
                    <div className="json-viewer-container">
                        <div style={{ padding: "0px 10px 10px 0px" }}>Outgoing JSON Payload</div>
                        <div className="json-viewer">
                            <ReactJson src={this.state.rating} name={"ratingRequestPayload"} />
                        </div>
                        <div style={{ padding: "10px 10px 10px 0px" }}>Incoming Response Data</div>
                        <ResponseJsonViewer requestResponse={this.state.requestResponse} />
                    </div>
                </div>
            </div>
        );
    }

    private getNewRating = (prevRating: IRating, value: any, fieldName: string) => {
        return {
            ...prevRating,
            [fieldName]: value,
        };
    }
}

export default App;
